# AgriLink - Smart Agricultural Marketplace

**A Digital Platform for Farmer-Buyer Connectivity, Price Discovery, and Agricultural Trade**

## Live Website

The AgriLink web application is deployed and accessible through the following link:

**Website URL:** https://agrilink-sih-syntexspark.onrender.com/

*Note: The above URL is the updated and working website link. Please refer to this link instead of the previously mentioned URL in the project presentation (PPT).*

## Project Overview

AgriLink is a full-stack web application developed by Team SyntaxSpark from Asansol Engineering College for Smart India Hackathon (SIH) 2026. The project aims to strengthen agricultural market connectivity by providing a digital platform that connects farmers directly with potential buyers.

The platform facilitates agricultural produce listings, price discovery, offer negotiation, and transaction-related workflows. It also incorporates multilingual support and grievance and feedback facilities to improve accessibility and user engagement.

AgriLink aims to make agricultural trading more transparent, accessible, and efficient through technology-driven solutions.

## Problem Statement

Farmers often face difficulties in reaching suitable buyers, discovering competitive market prices, and negotiating fair prices for their produce. Limited market access and dependence on intermediaries can reduce transparency and restrict trading opportunities.

AgriLink addresses these challenges by providing a centralized digital marketplace where farmers can showcase their produce and buyers can explore available products and negotiate prices.

## Project Objectives

- Establish a digital connection between farmers and buyers.
- Improve price discovery and agricultural market transparency.
- Enable online agricultural produce listings and buyer enquiries.
- Facilitate offers and counter-offers between farmers and buyers.
- Support transaction management and logistics coordination.
- Improve platform accessibility through multilingual support.
- Provide grievance and feedback mechanisms to encourage trust and accountability.

## Key Features

### 1. Farmer Module
- User registration and authentication.
- Creation and management of agricultural produce listings.
- Improved visibility of produce to potential buyers.
- Support for offers and price negotiations.

### 2. Buyer Module
- User registration and authentication.
- Browsing and discovery of available agricultural produce.
- Submission of offers and negotiation with farmers.
- Support for buyer–farmer interactions.

### 3. Administrator Module
- Dedicated administrator access.
- Administrative functionality for platform management.
- Support for monitoring relevant marketplace activities.

### 4. Price Discovery and Negotiation
- Digital agricultural produce listings.
- Offer and counter-offer workflows.
- Support for informed pricing and mutually agreed deals.

### 5. Transaction and Logistics Support
- Transaction-related workflows.
- Logistics coordination support.
- Improved organization of agricultural trading activities.

### 6. Trust, Grievance, and Feedback
- Review and trust-score functionality.
- Grievance submission facility.
- Feedback mechanisms for users.

### 7. Multilingual Support
- Integration with Google Language API.
- Multilingual accessibility to help users interact with the platform in supported languages.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | Role-based access and project-configured authentication |
| Language Integration | Google Language API |
| Deployment | Render |
| Version Control | Git and GitHub |

## System Architecture

AgriLink follows a full-stack web application architecture consisting of the following components:

1. **Frontend Layer:** Provides the interface through which farmers, buyers, and administrators access the application.
2. **Backend Layer:** Handles application requests, business logic, authentication, and marketplace operations.
3. **Database Layer:** Uses MySQL to store and manage application data.
4. **External Integration Layer:** Supports multilingual functionality through Google Language API integration.
5. **Deployment Layer:** Hosts the web application on Render for public access.

## How the Platform Works

1. Users access the platform through their respective roles.
2. Farmers publish information about available agricultural produce.
3. Buyers explore available listings and identify suitable products.
4. Buyers and farmers negotiate prices through offers and counter-offers.
5. Transaction-related and logistics workflows support the trading process.
6. Users can submit grievances and feedback through the available facilities.

## Local Installation and Setup

### Prerequisites

- Node.js and npm
- MySQL Server
- Git

### Installation Steps

**Step 1: Clone the repository**

```bash
git clone https://github.com/Soumajit1/AgriLink-SIH-SyntexSpark.git
cd AgriLink-SIH-SyntexSpark
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Configure environment variables**

Create a `.env` file in the project root and configure the database connection, authentication secrets, and API keys required by the application.

Use the variable names expected by the existing source code. Do not publish passwords, API keys, or other sensitive credentials in the repository.

**Step 4: Configure the database**

- Start MySQL Server.
- Create the required database.
- Import the project's database schema or execute the supplied SQL scripts.
- Verify the database configuration in the environment variables.

**Step 5: Run the application**

Use the start script defined in `package.json`. For example:

```bash
npm start
```

For development, use the development script if one is configured in the project.

Open the local application URL and port specified in the project configuration.

## Demo Access

AgriLink supports separate access for Farmers, Buyers, and Administrators.

Users can register through the available registration functionality. Any dedicated demonstration credentials provided to evaluators should be verified before use and shared securely rather than publishing private production credentials in this repository.

## Project Information

- **Project Name:** AgriLink
- **Event:** Smart India Hackathon 2026
- **Problem Statement ID:** 26132
- **Team Name:** SyntaxSpark
- **Institution:** Asansol Engineering College
- **Project Category:** Agriculture and Rural Development
- **Project Type:** Full-Stack Web Application

## Expected Impact

AgriLink aims to improve agricultural market accessibility by connecting farmers with potential buyers, supporting informed pricing decisions, simplifying produce discovery, and encouraging transparent digital trade.

The platform is designed to support stronger farmer–buyer relationships and contribute to a more accessible and efficient agricultural marketplace.

## Project Links

- **Live Website:** https://agrilink-sih-syntexspark.onrender.com/
- **GitHub Repository:** https://github.com/Soumajit1/AgriLink-SIH-SyntexSpark

## Team

**Team SyntaxSpark**  
Asansol Engineering College

Developed as part of Smart India Hackathon 2026.

---

**AgriLink — Building Digital Connections for Smarter Agricultural Trade.**
