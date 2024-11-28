const express = require('express');
const path = require('path');
const app = express();
const request = require('request');
const Database = require("@replit/database");
const { group } = require('console');
const _salaryPeriod = 10;

const db = new Database();




const url = process.env["API_URL"];
sendWebRequestToAPI(url, (data) => {
	db.set("expenses", data);
	let availableCategories = Array.from(
		new Set (
			JSON.parse(data)
			.map((expense) => expense.category)
			)
		)
	db.set("categories", availableCategories);
});



// Serve static files from the 'www' folder
app.use(express.static(path.join(__dirname, 'www')));

// Handle all other routes
app.get('/api/expenses', (req, res) => {
	var params = req.query;
	console.log("Being communicated with");
	console.log(params);
	params["period"] = _salaryPeriod;
	console.log(params);
	db.get("expenses").then((value) => {
		var expenses = JSON.parse(value.value);
		var result = filterExpenses(expenses, params);
		console.log(result)
		res.json(result);
		res.end()
	})
});

app.get('/api/budget', (req, res) => {
	var params = req.query;
	console.log("Being communicated with budgetwise");
	// TODO Make possible to get all periods for some reason
	var period = params["period"] ?? _salaryPeriod;
	console.log(`Period: ${period}`);
	db.get("budget").then((value) => {
		console.log(value)
		var budget = value.value[period];;
		res.json(budget);
		res.end()
	})
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
		"period": filterExpensesBySalaryPeriod,
		"includeSavings": filterSavings,
		"includeFixed": filterFixed,
		"by" : categorizeExpenses,
	}

	for (var handler of Object.keys(handlers)) {
		if (params[handler]) {
			expenses = handlers[handler](expenses, params[handler]);
		}
	}

	return expenses;
	
}

function filterExpensesBySalaryPeriod(expenses, period) {
	console.log("filtering expenses by salary period")
	console.log(`Number of expenses: ${expenses.length}`)
	return expenses.filter((expense) => {
		return expense.salaryPeriod == period;
	});
}

function filterSavings(expenses,include) {
	console.log("Filtering savings")
	console.log(`Number of expenses: ${expenses.length}`)
	console.log(include)
	include = {"true": true, "false": false}.include;
	console.log(include)
	if (include) return expenses;
	return expenses.filter((expense) => {
		return !expense.isSavings;
	})
}

function filterFixed(expenses,include) {
	include = {"true": true, "false": false}.include;
	if (include) return expenses;
	return expenses.filter((expense) => {
		return (!expense.isFixedExpense && expense.category != "Lön");
	})
}


function categorizeExpenses(expenses) {
	console.log("categorizing expenses");
	console.log(`Number of expenses: ${expenses.length}`);
	console.log(expenses);
	const categorizedExpenses = {};

	expenses.forEach(expense => {
		const category = expense.category;
		if (!categorizedExpenses[category]) {
			categorizedExpenses[category] = [];
		}
		categorizedExpenses[category].push(expense);
	});

	return categorizedExpenses;
};

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
