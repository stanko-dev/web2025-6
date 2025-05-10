# Web2025-6: Notes Service

![Node.js](https://img.shields.io/badge/Node.js-v22.14.0-green)  
![Express.js](https://img.shields.io/badge/Express.js-v4.18.2-blue)  
![Nodemon](https://img.shields.io/badge/Nodemon-v3.1.4-orange)  
![Swagger](https://img.shields.io/badge/Swagger-v4.15.5-brightgreen)  
![Postman](https://img.shields.io/badge/Postman-Tested-red)  
![Commander.js](https://img.shields.io/badge/Commander.js-v12.1.0-purple)  
![Status](https://img.shields.io/badge/Status-Completed-success)

A simple Node.js-based notes management service built with Express.js for Lab #6.

## Overview
This project implements a web server to create, read, update, and delete notes using HTTP methods (GET, PUT, DELETE, POST). It includes command-line parameters, caching, a web form, and Swagger documentation.

## Features
- Handle notes with GET, PUT, DELETE, and POST requests
- Command-line args for host, port, and cache directory (using Commander.js)
- Automatic server restart with nodemon
- Web form for note creation
- Swagger UI at `/docs` for API documentation
- Tested with Postman
