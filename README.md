# TypeScript Project with Aave & VALR Integrations

## Overview

This project is a TypeScript-based application integrating with AAVE and VALR to track the Arbitrage between VALR lending rates and AAVE borrow rates

## Quickstart
```bash
   docker run -it -e VALR_API_KEY=<key> -e VALR_API_SECRET=<secret> -p 3000:3000 yashutanna/valr-aave-arbitrage:latest
```

## Prerequisites

- **Node.js**: >= 20.x.x

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd <project-folder>
   ```
3. Install dependencies using Yarn:
   ```bash
   npm install
   ```

## Usage

### .env.sample
Create a `.env` file from `.env.sample`
```bash
cp .env.sample .env
```

Add you VALR Read-only API key and secret


### Development Server
Run the development server using:
```bash
npm run start
```
This will start any defined Express.js server or development tools.

### Building the Application

To compile the TypeScript code into JavaScript, containerise it and run it using docker-compose use:
```bash
npm run deploy
```
