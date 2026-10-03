# 💰 Expense & Budget Visualizer

A simple and responsive web application for tracking daily expenses and visualizing spending distribution by category.

This project was developed as part of the **CodingCamp** assignment using **HTML, CSS, and Vanilla JavaScript** without any backend server. Transaction data is stored directly in the browser using the **Local Storage API**.

## ✨ Features

### 📝 Add Transaction

Users can add a new transaction with:

* Item Name
* Amount
* Category

  * Food
  * Transport
  * Fun

All fields are validated before the transaction is added.

### 📋 Transaction List

The application displays all added transactions in a scrollable list.

Each transaction contains:

* Name
* Amount
* Category
* Delete action

Transactions can be deleted at any time.

### 💵 Total Balance

The total balance is displayed at the top of the application and updates automatically whenever transactions are added or deleted.

### 📊 Visual Chart

An interactive pie chart displays the distribution of spending based on category.

The chart updates automatically when transaction data changes.

## 🛠️ Tech Stack

* **HTML** — Application structure
* **CSS** — Styling and responsive interface
* **Vanilla JavaScript** — Application logic and interactions
* **Local Storage API** — Client-side data storage
* **Chart.js** — Spending visualization

The project follows the required technical constraint of using HTML, CSS, Vanilla JavaScript, and client-side Local Storage without a backend server.

## 📂 Project Structure

```text
CodingCamp-28September26-MuhammadAbhiraffaHamizan/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   └── script.js
│
├── .kiro/
│
└── README.md
```

The project keeps only **one CSS file inside `css/`** and **one JavaScript file inside `js/`**, following the assignment folder rules.

## 🎯 Project Goals

The Expense & Budget Visualizer is designed to help users:

* Track daily spending
* View transaction history
* Monitor total balance
* Understand spending distribution through a visual chart

The application is designed to be simple, easy to understand, mobile-friendly, and responsive.

## 💾 Data Storage

All transaction data is stored locally in the user's browser using the **Local Storage API**.

No backend server or external database is required.

This means transaction data remains on the browser/device where the application is being used.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/raffahamizan02/CodingCamp-28September26-MuhammadAbhiraffaHamizan.git
```

### 2. Open the Project

Open the project folder and launch:

```text
index.html
```

You can also use a local development extension such as **Live Server** in Visual Studio Code.

### 3. Start Using the Application

Add your expenses through the input form, view them in the transaction list, and check the spending distribution through the chart.

## 🌐 Deployment

This project can be published using **GitHub Pages**.

The assignment requires the source code to be pushed to GitHub and the website to be published through GitHub Pages.

## 📱 Browser Compatibility

The application is intended to work on modern browsers, including:

* Google Chrome
* Mozilla Firefox
* Microsoft Edge
* Safari

## 📌 Assignment Requirements

The project implements the required MVP components:

* ✅ Input Form
* ✅ Transaction List
* ✅ Delete Transaction
* ✅ Total Balance
* ✅ Spending Distribution Chart
* ✅ Local Storage
* ✅ Responsive / Mobile-Friendly Interface
* ✅ GitHub Repository
* ✅ GitHub Pages Deployment

## 👨‍💻 Author

**Muhammad Abhiraffa Hamizan**

CodingCamp — September 2026

---

> **Expense & Budget Visualizer**
> Track your expenses. Understand your spending. Manage your budget.
