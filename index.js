const express = require("express");
const path = require("path");
const app = express();
const request = require("request");
const Database = require("@replit/database");
const { group } = require("console");
const _salaryPeriod = 10;
const argon2 = require("argon2");
const cookieParser = require("cookie-parser");
const db = new Database();

/*
argon2.hash("dsfasfadsfa:)").then((password) => {
	const myUser = {
		userName: "kalle",
		password: password,
		userId: "d7be82",
		firstName: "Kalle",
		APIurl: process.env["API_URL"]
	};
	db.set("users", [myUser]).then(() => {
		console.log("Set user")
	});
})
*/
db.get("users").then(users => console.log(users));

const url = process.env["API_URL"];
sendWebRequestToAPI(url, (data) => {
	db.set("expenses", [
		{
			user: "d7be82",
			expenses: data,
		},
	]);
	let availableCategories = Array.from(
		new Set(JSON.parse(data).map((expense) => expense.category)),
	);
	db.set("categories", availableCategories);
});

// Serve static files from the 'www' folder
app.use(express.static(path.join(__dirname, "www")));

// Middleware to parse JSON request body
app.use(express.json()); // This is required to parse JSON in the body of requests
app.use(cookieParser());

// Handle all other routes
app.get("/api/expenses", (req, res) => {
	var params = req.query;
	var userId = params.userid;

	console.log("Being communicated with expenseswise");
	//params["period"] = _salaryPeriod;
	db.get("expenses").then((value) => {
		var expenses = value.value;
		var dataForUser = expenses.find((expense) => expense.user === userId);
		if (dataForUser) {
			var expensesForUser = JSON.parse(dataForUser.expenses);
			var result = filterExpenses(expensesForUser, params);
			res.status(200).json(result);
			res.end();
		} else {
			res.status(500).json({
				error: "No expenses found for this user",
			});
		}
	});
});

app.get("/api/users", (req, res) => {
	console.log("Being communicated with userwise");
	var {id} = req.query;
	console.log(id)
	if (!id) {
		res.status(500).json({
			status: "not good"
		})
	}
	db.get("users").then((users) => {
		let user = users.value.find((user) => user.userId == id);
		if (!user || user.sessionToken != req.cookies.session_token) {
			res.status(401).json({
				success: false,
				message: "User not found"
			});
			res.end();
			return;
		}
		res.status(200).json({
			userName: user.userName,
			firstName: user.firstName,
			APIurl: user.APIurl,
			userId: user.userId,
		});
		res.end();
	});
});

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
	console.log(req.cookies);
	const { username, password, rememberMe } = req.body;
	if (!username || !password) {
		return res
			.status(400)
			.json({ message: "Username and password are required." });
	}

	try {
		const users = await db.get("users");
		const user = users.value.find((u) => u.userName === username);

		if (!user) {
			return res.status(401).json({ message: "Invalid credentials." });
		}

		const isPasswordValid = await argon2.verify(user.password, password);
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid credentials." });
		}

		if (rememberMe) {
			// Generate session token (JWT or custom token)
			const sessionToken = genRanHex(32); // Replace with a JWT for production
			users.value[users.value.indexOf(user)].sessionToken = sessionToken;
			await db.set("users", users.value);
			res.cookie("session_token", sessionToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.cookie("userId", user.userId, {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});
		}
		

		// Send response
		res.status(200).json({
			message: "Login successful",
			data: { userName: user.userName, userId: user.userId },
		});
	} catch (error) {
		console.error("Login Error:", error);
		res.status(500).json({ message: "Internal server error" });
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
