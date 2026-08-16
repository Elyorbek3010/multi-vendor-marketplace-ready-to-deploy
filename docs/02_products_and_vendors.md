# 02 Products and Vendors Architecture

This document outlines the core business entities for the marketplace: Vendors and Products.

## 1. Database Relationships

The system uses a highly relational structure linking authentication, vendor profiles, and product catalogs:

- **User**: The base entity representing an account (CustomUser).
- **VendorProfile**: A 1-to-1 relationship with the `User` model. A User with the `VENDOR` role will have a `VendorProfile` describing their store, description, and approval status.
- **Category**: A hierarchical model (self-referencing foreign key) used to organize products globally.
- **Product**: The core catalog item. It has a Foreign Key to `VendorProfile` (the owner) and a Foreign Key to `Category`. 
- **ProductImage**: Has a Foreign Key to `Product`, allowing 1-to-many images per product.
- **Inventory**: Has a 1-to-1 relationship with `Product`, keeping stock management decoupled from core product details for cleaner domain logic.

## 2. The Service / Selector Pattern

Django applications typically suffer from "Fat Models" or "Fat Views" as business logic grows. This project uses the **Service/Selector pattern** to keep code maintainable:

- **Services (`services.py`)**: Handle *writes* (Create, Update, Delete). If you need to create a product and automatically initialize its inventory, that logic lives in a service function (e.g., `create_product()`), not in the ViewSet or a Signal.
- **Selectors (`selectors.py`)**: Handle *reads* (Queries). Complex filtering, like finding all active products for a specific category, lives in a selector function (e.g., `get_products_by_category()`).
- **ViewSets**: Stay incredibly thin, focusing only on parsing requests, checking permissions, and calling the appropriate service/selector to get data for the serializer.

**Benefits**: This pattern makes business logic extremely easy to test in isolation, prevents circular dependencies, and keeps API layers decoupled from core rules.

## 3. Example API Payloads

### Creating a Category (Admin Only)
*Since categories dictate the platform structure, they are usually managed by admins.*
**POST** `/api/products/categories/`
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "parent": null
}
```

### Creating a Product (Vendor Only)
*When a vendor sends this payload, the backend automatically attaches it to their `VendorProfile`.*
**POST** `/api/products/items/`
```json
{
  "category": "<category-uuid>",
  "title": "Wireless Noise-Canceling Headphones",
  "description": "High fidelity audio with 30-hour battery life.",
  "price": "199.99"
}
```
*Note: The response will include the auto-generated `inventory` sub-object with a stock of `0`.*
