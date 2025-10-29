# Magna Inventory Billing: Your All-in-One Invoicing & Inventory Management Solution

Magna Inventory Billing is a powerful, modern, and scalable SaaS application designed to streamline your business operations. Built with a cutting-edge tech stack, it provides a comprehensive suite of tools to manage everything from invoices and payments to inventory and procurement, all within a single, intuitive interface.

This application is built entirely on the client-side, leveraging your browser's local storage for a fast, responsive, and offline-capable experience without the immediate need for complex backend infrastructure. It uses Firebase for secure user authentication and is architected to seamlessly integrate with a Firestore database for future scalability.

## Core Features

### 1. **Intuitive Dashboard**
Get a real-time overview of your business health. The main dashboard provides at-a-glance insights into:
- **Total Revenue:** Track all paid invoices.
- **Outstanding Revenue:** See the total amount due from unpaid invoices.
- **Invoice Volume:** Monitor the total number of invoices created.
- **Recent Activity:** View a list of your most recent invoices for quick access.

### 2. **Comprehensive Invoice Management**
- **Create & Edit Invoices:** A rich form allows for the creation and modification of detailed invoices, linking directly to your product inventory.
- **Status Tracking:** Manage the entire lifecycle of an invoice with statuses: `Draft`, `Sent`, `Paid`, and `Cancelled`.
- **Automated PDF & Emailing:** Automatically generate and email professional PDF invoices to clients upon creation.
- **Dynamic Tax Calculation:** Apply pre-configured tax rates to your invoices with ease.
- **Export Functionality:** Export invoice data to both PDF and Excel for your records.

### 3. **Integrated Stripe Payments**
- **Secure Configuration:** Securely store your Stripe API keys in the application settings.
- **Automated Payment Links:** A reusable Genkit workflow automatically generates a unique Stripe Payment Link for every new or updated invoice.
- **Automated Status Updates:** Using Stripe Webhooks, the application automatically updates an invoice's status to `Paid` upon successful payment, creating a seamless, automated payment workflow.

### 4. **Full-Cycle Inventory Control**
- **Product Master:** Manage your complete product catalog, including names, prices, units, and categories.
- **Unit & Category Management:** Define custom units (e.g., pcs, kg, box) and categories to organize your inventory effectively.
- **Purchase Orders:** Create and manage purchase orders to send to your suppliers.
- **Purchase Entries:** Easily record incoming stock from suppliers, either manually or by referencing an existing purchase order.
- **Item Tracking:** A detailed ledger provides a complete history of every item moving in or out of your inventory, whether from a sale or a purchase.
- **Low Stock Alerts:** Set a threshold for each product and receive automatic notifications on your dashboard when stock is running low.

### 5. **Supplier & Tax Management**
- **Supplier Directory:** Maintain a detailed directory of your suppliers with contact information and view their entire purchase order history from a single page.
- **Tax Master:** Configure multiple tax rates (e.g., GST, VAT) that can be applied to invoices.
- **Tax Reporting:** A dedicated page allows you to filter and view all taxes collected from invoices within a specific date range, complete with summary totals.

### 6. **AI-Powered Enhancements**
- **Invoice Readability Analysis:** Leverage the power of Google's Gemini models via Genkit to analyze your invoice's text and receive AI-driven suggestions for improving its clarity and professionalism.

## Why Magna Inventory Billing is the Optimal Solution

- **Modern & Performant Tech Stack:** Built with **Next.js**, **React**, and **Tailwind CSS**, Magna Inventory Billing offers a fast, responsive, and mobile-friendly user experience. Server Components and the App Router ensure optimal performance.
- **Client-Side First Architecture:** By leveraging browser `localStorage`, the application is incredibly fast and works offline. This architecture allows you to get started immediately without incurring backend or database costs, while being ready to scale to a full cloud backend (like Firestore) when needed.
- **Secure by Design:** User management is handled by **Firebase Authentication**, a robust and secure service. Sensitive credentials like Stripe and SMTP keys are stored on the client, with clear warnings about security best practices.
- **Scalable & Reusable Workflows:** The use of **Genkit** for server-side actions (like generating payment links and sending emails) creates reusable, powerful workflows that are decoupled from the UI, making the application easier to maintain and extend.
- **End-to-End Business Logic:** Magna Inventory Billing isn't just an invoicing tool; it's a complete business management solution that seamlessly integrates sales, inventory, and procurement in one place, providing a single source of truth for your operations.

## Getting Started

1.  **Sign Up:** Create an account to get started.
2.  **Configure Settings:** Navigate to the **Settings** page to:
    - Set your company profile and default currency.
    - Configure your SMTP details for sending emails.
    - Enter your Stripe API keys to enable payments.
    - Add your tax rates.
3.  **Set Up Inventory:** Go to the **Units**, **Categories**, and **Product Master** pages to add your inventory.
4.  **Create Your First Invoice:** Go to **Invoices** and create your first invoice!
