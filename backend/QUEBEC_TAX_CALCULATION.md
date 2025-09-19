# Québec Tax Calculation Guide

This document outlines how sales tax is calculated for orders in our flower store, following Québec tax regulations.

## Tax Rates

In Québec, there are two applicable sales taxes:
- GST (Goods and Services Tax): 5%
- QST (Québec Sales Tax): 9.975%

Combined rate: 14.975%

## Tax Calculation Process

1. **Taxable Amount**
   - Product subtotal
   - Delivery fee (if applicable)
   - Total taxable amount = Product subtotal + Delivery fee

2. **Tax Calculation**
   - Combined tax rate: 14.975%
   - Tax amount = (Product subtotal + Delivery fee) × 0.14975
   - Tax is rounded to nearest cent

3. **Final Total**
   - Final total = Taxable amount + Tax amount

## Example Calculations

### Example 1: Product with Delivery
- Product: $10.00
- Delivery fee: $20.00
- Taxable amount: $30.00
- Tax (14.975%): $4.49
- Final total: $34.49

### Example 2: Product Only (Pickup)
- Product: $10.00
- Delivery fee: $0.00
- Taxable amount: $10.00
- Tax (14.975%): $1.50
- Final total: $11.50

## Implementation Details

The tax calculation is implemented in:
- `backend/routes/stripe.js` - For Stripe checkout session creation
- Tax is calculated on the combined total of products and delivery fee
- All calculations are done in cents to avoid floating-point issues
- Rounding is applied after tax calculation

## Code Example

```javascript
const QUEBEC_TAX_RATE = 0.14975; // Combined GST (5%) + QST (9.975%)
const taxableAmount = subtotal + deliveryFee;
const taxAmount = Math.round(taxableAmount * QUEBEC_TAX_RATE);
const total = taxableAmount + taxAmount;
```

## Important Notes

1. Tax is applied to both products and delivery fees as per Québec regulations
2. All monetary values are stored and calculated in cents to ensure precision
3. Tax is calculated on the combined total before being added to the final amount
4. The tax calculation follows Québec's standard practice of applying both GST and QST to the full amount charged to the customer
