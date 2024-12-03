const express = require("express");
const path = require("path");
const app = express();
const request = require("request");
const Database = require("@replit/database");
const { group } = require("console");
const _salaryPeriod = 10;
const argon2 = require('argon2');
const db = new Database();


/*
argon2.hash("password").then((password) => {
	const myUser = {
		userName: "test",
		password: password,
		userId: genRanHex(6)
	};
	db.set("users", [myUser]).then(() => {
		console.log("Set user")
	});
	
})
*/




const url = process.env["API_URL"];
sendWebRequestToAPI(url, (data) => {
	db.set("expenses", data);
	let availableCategories = Array.from(
		new Set(JSON.parse(data).map((expense) => expense.category)),
	);
	db.set("categories", availableCategories);
});

// Serve static files from the 'www' folder
app.use(express.static(path.join(__dirname, "www")));

// Middleware to parse JSON request body
app.use(express.json()); // This is required to parse JSON in the body of requests

// Handle all other routes
app.get("/api/expenses", (req, res) => {
	var params = req.query;
	console.log("Being communicated with");
	//params["period"] = _salaryPeriod;
	db.get("expenses").then((value) => {
		var expenses = JSON.parse(value.value);
		var result = filterExpenses(expenses, params);
		res.json(result);
		res.end();
	});
});

app.get("/api/users", (req, res) => {
	console.log("Being communicated with userwise")
	var params = req.query;
	console.log(params);
	db.get("users").then((users) => {
		let user = users.value.find((user) => user.userId == params.id);
		delete user.password;
		res.status(200).json(user);
		res.end();
	})
})

app.get("/api/budget", (req, res) => {
	var params = req.query;
	console.log("Being communicated with budgetwise");
	// TODO Make possible to get all periods for some reason
	var period = params["period"] ?? _salaryPeriod;
	db.get("budget").then((value) => {
		var budget = value.value[period];
		res.json(budget);
		res.end();
	});
});

app.post("/api/post/budget", (req, res) => {
	try {
		// Process the data here (e.g., save to database)
		db.get("budget").then((value) => {
			var oldBudget = value.value;
			oldBudget[_salaryPeriod] = req.body;
			db.set("budget", oldBudget).then(() => {});
		});

		res.status(200).json({
			message: "Budget data successfully received and processed",
			data: req.body,
		});
	} catch (error) {
		res.status(500).json({
			message: "Internal Server Error: Something went wrong.",
			error: error.message, // Include error message for debugging
		});
	}
});

app.post("/api/post/login", async (req, res) => {
	console.log(req.body);
	var invalidCredentials = false;
	try {
		// Process the data here (e.g., save to database)
		await db
			.get("users")
			.then((value) => {
				var allUsers = value.value;
				console.log(`Got all users`);
				console.log(allUsers);
				var user = allUsers.find((user) => {
					return (
						user.userName === req.body.username &&
					argon2.verify(user.password,req.body.password)
					);
				});
				if (!user) {
					invalidCredentials = true;
					console.log(`No valid user was found`);
					throw new Error("Invalid credenials");
				}
				console.log(`I am prepared to send succesfulness`);
				delete user.password;
				res.status(200).json({
					message: "Valid Credentials",
					data: user,
				});
			})
			.catch((error) => {
				console.log(`I am in the first catch`);
				return res.status(500).json({
					message: "Internal Server Error: Something went wrong.",
					error: error.message, // Include error message for debugging
				});
			});
	} catch (error) {
		console.log(`I am in the second catch`);
		res.status(invalidCredentials? 401 : 500).json({
			message: invalidCredentials ? "Invalid Credentials" : "Internal Server Error: Something went wrong.",
			error: error.message, // Include error message for debugging
		});
		return;
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});

function sendWebRequestToAPI(url, callback) {
	console.log("sending request");
	request(url, (error, response, body) => {
		if (!error && response.statusCode == 200) {
			console.log("we don't have an error");
			callback(JSON.parse(body).data);
		} else {
			callback(error || new Error("Request to API failed"), null);
		}
	});
}

function filterExpenses(expenses, params) {
	const handlers = {
		period: filterExpensesBySalaryPeriod,
		includeSavings: filterSavings,
		includeFixed: filterFixed,
		by: categorizeExpenses,
	};

	for (var handler of Object.keys(handlers)) {
		if (params[handler]) {
			expenses = handlers[handler](expenses, params[handler]);
		}
	}

	return expenses;
}

function filterExpensesBySalaryPeriod(expenses, period) {
	return expenses.filter((expense) => {
		return expense.salaryPeriod == period;
	});
}

function filterSavings(expenses, include) {
	include = { true: true, false: false }.include ?? false;
	if (include) return expenses;
	return expenses.filter((expense) => {
		return !expense.isSavings;
	});
}

function filterFixed(expenses, include) {
	include = { true: true, false: false }.include ?? false;
	if (include) return expenses;
	return expenses.filter((expense) => {
		return (
			!expense.isFixedExpense &&
			expense.category != "Lön" &&
			expense.category != "Xtraspar"
		);
	});
}

function categorizeExpenses(expenses) {
	const categorizedExpenses = {};

	expenses.forEach((expense) => {
		const category = expense.category;
		if (!categorizedExpenses[category]) {
			categorizedExpenses[category] = [];
		}
		categorizedExpenses[category].push(expense);
	});

	return categorizedExpenses;
}

function getStandardBudget() {
	return {
		Kläder: 0,
		Bar: 0,
		"Taxi & transport": 0,
		Tågresa: 0,
		"Träning & Hälsa": 0,
		Resa: 0,
		Restaurang: 0,
		Prenumerationer: 0,
		Småköp: 0,
		"Second hand": 0,
		Bil: 0,
		Livsmedel: 0,
		"Nöje & underhållning": 0,
		"SL biljett": 0,
	};
}

function genRanHex(size) {
	return [...Array(size)]
		.map(() => Math.floor(Math.random() * 16).toString(16))
		.join("");
}
