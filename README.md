# Personal Finance Tracker - Spring Boot Backend

A REST API backend for tracking personal financial transactions built with Spring Boot 3.2, Spring Data JPA, and H2 database.

## Project Structure

```
src/
├── main/
│   ├── java/com/financetracker/
│   │   ├── FinanceTrackerApplication.java    # Main Spring Boot application
│   │   ├── entity/
│   │   │   └── Transaction.java              # JPA Entity for transactions
│   │   ├── repository/
│   │   │   └── TransactionRepository.java    # Spring Data JPA Repository
│   │   ├── controller/
│   │   │   └── TransactionController.java    # REST Controller with endpoints
│   │   └── config/
│   │       └── CorsConfig.java               # CORS configuration
│   └── resources/
│       └── application.properties             # Application configuration
```

## Features:

- **Transaction Entity**: Stores transaction data with id, description, amount, date, and category
- **REST API Endpoints**:
  - `GET /api/transactions` - Retrieve all transactions
  - `GET /api/transactions/{id}` - Retrieve a specific transaction
  - `POST /api/transactions` - Create a new transaction
  - `PUT /api/transactions/{id}` - Update an existing transaction
  - `DELETE /api/transactions/{id}` - Delete a transaction
  - `GET /api/transactions/summary/total` - Get total sum of all transactions
  - `GET /api/transactions/summary/category/{category}` - Get total sum by category
- **CORS Support**: Enabled for localhost:3000 (React frontend)
- **Custom JPA Queries**: Calculate total sum of transactions

## Prerequisites:

- Java 17 or higher
- Maven 3.6+

## Running the Application

1. **Build the project**:
   ```bash
   mvn clean install
   ```

2. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

   The application will start on `http://localhost:8080`

3. **Access H2 Console** (optional - for development):
   - Navigate to `http://localhost:8080/h2-console`
   - JDBC URL: `jdbc:h2:mem:financedb`
   - Username: `sa`
   - Password: (leave empty)

## API Usage Examples

### Create a Transaction
```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Grocery shopping",
    "amount": 50.00,
    "date": "2026-04-11",
    "category": "Food"
  }'
```

### Get All Transactions
```bash
curl http://localhost:8080/api/transactions
```

### Get Total Sum
```bash
curl http://localhost:8080/api/transactions/summary/total
```

### Get Total by Category
```bash
curl http://localhost:8080/api/transactions/summary/category/Food
```

## CORS Configuration

The backend is configured to accept requests from `http://localhost:3000` (React frontend):
- Allowed Methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed Headers: All
- Allows Credentials: Yes
- Max Age: 3600 seconds

## Database

The application uses **H2** database, which is:
- In-memory (data is lost on restart)
- Pre-configured for development
- Easy to switch to PostgreSQL/MySQL by changing `pom.xml` and `application.properties`

## Technologies Used

- **Spring Boot 3.2**: Framework
- **Spring Data JPA**: Database access
- **H2 Database**: Development database
- **Lombok**: Reduce boilerplate code
- **Maven**: Build tool

## Next Steps

1. Connect with your React frontend at `localhost:3000`
2. For production, switch to PostgreSQL or MySQL database
3. Add authentication (JWT, Spring Security)
4. Add validation annotations to the Transaction entity
5. Implement pagination and filtering for transactions
