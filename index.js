const express = require("express");
const path = require("path");
const app = express();
const Database = require("@replit/database");
const _salaryPeriod = 10;
const argon2 =require("argon2");
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

db.list().then(keys => console.log(keys));
db.get("users").then(user => console.log(user))

db.get("budget").then((budget) => {
	let wrongAgain = budget.value;
	let kalle = wrongAgain[0];

  let kallesUserName = kalle.user;

	let helenesRealThing = {
		user: 'de70f9',
		budget: {
			'2023-11': getStandardBudget(),
			'2024-0': getStandardBudget(),
			'2024-1': getStandardBudget(),
			'2024-2': getStandardBudget(),
			'2024-3': getStandardBudget(),
			'2024-4': getStandardBudget(),
			'2024-5': getStandardBudget(),
			'2024-6': getStandardBudget(),
			'2024-7': getStandardBudget(),
			'2024-8': getStandardBudget(),
			'2024-9': getStandardBudget(),
			'2024-10': getStandardBudget(),
			'2024-11': getStandardBudget(),
		}
	};

  let kallesRealThing = {
    user: kallesUserName,
    budget: {
        '2023-11': getStandardBudget(),
        '2024-0': getStandardBudget(),
        '2024-1': getStandardBudget(),
        '2024-2': getStandardBudget(),
        '2024-3': getStandardBudget(),
        '2024-4': getStandardBudget(),
        '2024-5': getStandardBudget(),
        '2024-6': getStandardBudget(),
        '2024-7': getStandardBudget(),
        '2024-8': getStandardBudget(),
        '2024-9': getStandardBudget(),
        '2024-10': getStandardBudget(),
        '2024-11': getStandardBudget(),
      }
  };

	db.set("budget", [kallesRealThing, helenesRealThing])
})

*/

// Serve static files from the 'www' folder
app.use(express.static(path.join(__dirname, "www")));

// Middleware to parse JSON request body
app.use(express.json()); // This is required to parse JSON in the body of requests
app.use(cookieParser());

// Handle all other routes
app.get("/api/expenses", async (req, res) => {
  var params = req.query;
  var userId = params.id;

  console.log("Being communicated with expenseswise");
  //params["period"] = _salaryPeriod;
  db.get("users").then(async (usersObject) => {
    var users = usersObject.value;
    var user = users.find((userData) => userData.userId === userId);
    if (!user || !user.APIurl) {
      res.status(404).json({
        success: false,
        message: "User not found or has no valid API endpoint",
      });
      return;
    }

    if (req.cookies.session_token != user.sessionToken) {
      res.status(401).json({
        success: false,
        message: "Invalid session token",
      });
      return;
    }

    await getExpensesFromAPI(user.APIurl)
      .then((data) => {
        let expenses = filterExpenses(JSON.parse(data), params);
        res.status(200).json(expenses);
        res.end();
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({
          success: false,
          message: error,
        });
        res.end();
      });
  });
});

app.get("/api/users", (req, res) => {
  console.log("Being communicated with userwise");
  var { id } = req.query;
  console.log(id);
  if (!id) {
    res.status(500).json({
      message: "No user id provided",
      success: "not good",
      data: null,
    });
  }
  db.get("users").then((users) => {
    let user = users.value.find((user) => user.userId == id);
    if (!user || user.sessionToken != req.cookies.session_token) {
      res.status(401).json({
        success: false,
        message: "Can't fetch users.",
        data: null,
      });
      res.end();
      return;
    }
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        userName: user.userName,
        firstName: user.firstName,
        APIurl: user.APIurl,
        userId: user.userId,
      },
    });
    res.end();
  });
});

app.get("/api/budget", async (req, res) => {
  var params = req.query;
  const userId = params.id;
  console.log("Being communicated with budgetwise");
  // TODO Make possible to get all periods for some reason
  var period = params["period"] ?? _salaryPeriod;
  var budgetObject = await db.get("budget");
  var budgets = budgetObject.value;
  var budgetsForUser = budgets.find((budget) => budget.user == userId);
  if (!budgetsForUser) {
    res.status(404).json({
      success: false,
      message: "Budget not found",
      data: null,
    });
  }
  console.log(budgetsForUser);
  var budgetForPeriod = budgetsForUser.budget[period];
  console.log("What I got");
  console.log(budgetForPeriod);
  res.status(200).json(budgetForPeriod);
});

app.post("/api/post/budget", (req, res) => {
  var params = req.query;
  const userId = params.id;
  const salaryPeriod = params.period;

  if (!userId || !salaryPeriod) {
    res.status(500).json({
      success: false,
      message: "No user id or salary period provided",
      data: null,
    });
  }
  
  try {
    // Process the data here (e.g., save to database)
    db.get("budget").then((value) => {
      var oldBudget = value.value;
      var budgetForUser = oldBudget.find((budget) => budget.user == userId);
      if (!budgetForUser) {
        res.status(404).json({
          success: false,
          message: "No user id or salary period provided",
          data: null,
        })
      }
      budgetForUser["budget"][salaryPeriod] = req.body;
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

    if (rememberMe) {
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
      data: {
        userName: user.userName,
        userId: user.userId,
        firstName: user.firstName,
        APIurl: user.APIurl,
      },
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

async function getExpensesFromAPI(url) {
  return new Promise(async (resolve, reject) => {
    let response = await fetch(url);
    if (response.ok) {
      let data = await response.json();
      resolve(data.data);
    } else {
      reject("Request failed");
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
  include = { true: true, false: false }[include] ?? false;
  if (include) return expenses;
  return expenses.filter((expense) => {
    return !expense.isSavings;
  });
}

function filterFixed(expenses, include) {
  include = { true: true, false: false }[include] ?? false;
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
