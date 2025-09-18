import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '@/contexts/CartContext';
import { UserProvider } from '@/contexts/UserContext';
import CheckoutForm from '../CheckoutForm';

// Mock the stripe checkout button component
jest.mock('../StripeCheckoutButton', () => ({
  __esModule: true,
  default: ({ children, deliveryInfo }: any) => (
    <button onClick={() => console.log('Mock Stripe Checkout', deliveryInfo)}>
      {children}
    </button>
  ),
}));

// Mock data
const mockShopId = '68c34f45ee89e0fd81c8aa4d';
const mockCartItems = [
  {
    productId: '68c481477ce29a44c75aab63',
    name: 'Test Product (Deluxe)',
    price: 2000,
    image: 'test-image.jpg',
    selectedTier: 'deluxe',
    quantity: 1,
  },
];

// Mock user session
const mockUserSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  access_token: 'test-token',
};

// Test form data
const validFormData = {
  recipient: {
    name: 'John Doe',
    phone: '5146920307',
    email: 'john@example.com',
  },
  occasion: 'birthday',
  cardMessage: 'Happy Birthday!',
  contactPhone: '5146920307',
  contactEmail: 'contact@example.com',
  delivery: {
    address: {
      company: 'Test Company',
      street: '123 Test St',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H2X 2C9',
      country: 'Canada',
    },
    date: '2025-09-26',
    time: '10:00',
    instructions: 'Test instructions',
    buzzerCode: '123',
  },
};

// Helper function to fill out the form
const fillForm = async (user: any, data = validFormData) => {
  // Fill recipient information
  await user.type(screen.getByLabelText(/Recipient Name/i), data.recipient.name);
  await user.type(screen.getByLabelText(/Recipient Phone/i), data.recipient.phone);
  await user.type(screen.getByLabelText(/Recipient Email/i), data.recipient.email);

  // Fill occasion and card message
  await user.click(screen.getByRole('combobox', { name: /occasion/i }));
  await user.click(screen.getByText(data.occasion));
  await user.type(screen.getByLabelText(/Card Message/i), data.cardMessage);

  // Fill contact information
  await user.type(screen.getByLabelText(/Your Phone Number/i), data.contactPhone);
  await user.type(screen.getByLabelText(/Your Email Address/i), data.contactEmail);

  // Fill delivery information
  await user.type(screen.getByLabelText(/Company\/Business Name/i), data.delivery.address.company);
  await user.type(screen.getByLabelText(/Street Address/i), data.delivery.address.street);
  await user.type(screen.getByLabelText(/City/i), data.delivery.address.city);
  
  // Select province
  await user.click(screen.getByRole('combobox', { name: /province/i }));
  await user.click(screen.getByText('Quebec'));
  
  await user.type(screen.getByLabelText(/Postal Code/i), data.delivery.address.postalCode);
  
  // Fill delivery date and time
  await user.type(screen.getByLabelText(/Delivery Date/i), data.delivery.date);
  await user.click(screen.getByRole('combobox', { name: /Delivery Time/i }));
  await user.click(screen.getByText('10:00 AM'));
  
  await user.type(screen.getByLabelText(/Delivery Instructions/i), data.delivery.instructions);
  await user.type(screen.getByLabelText(/Buzzer\/Entry Code/i), data.delivery.buzzerCode);
};

describe('CheckoutForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockCartItems));
    Storage.prototype.setItem = jest.fn();
  });

  const renderCheckoutForm = () => {
    return render(
      <UserProvider initialSession={mockUserSession}>
        <CartProvider>
          <CheckoutForm
            shopId={mockShopId}
            onSuccess={mockOnSuccess}
            onError={mockOnError}
          />
        </CartProvider>
      </UserProvider>
    );
  };

  it('renders empty cart message when cart is empty', () => {
    Storage.prototype.getItem = jest.fn(() => JSON.stringify([]));
    renderCheckoutForm();
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('renders all form sections when cart has items', () => {
    renderCheckoutForm();
    expect(screen.getByText(/Delivery Method/i)).toBeInTheDocument();
    expect(screen.getByText(/Recipient Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Occasion & Card Message/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Contact Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivery Address/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Try to submit without filling any fields
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    expect(await screen.findByText(/Recipient name is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Fill invalid email
    await user.type(screen.getByLabelText(/Recipient Email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/Your Email Address/i), 'invalid-email');
    
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    expect(await screen.findByText(/Please enter a valid recipient email address/i)).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Fill invalid phone number
    await user.type(screen.getByLabelText(/Recipient Phone/i), '123');
    await user.type(screen.getByLabelText(/Your Phone Number/i), '123');
    
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    expect(await screen.findByText(/Please enter a valid recipient phone number/i)).toBeInTheDocument();
  });

  it('validates postal code format', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Fill form with invalid postal code
    const invalidData = {
      ...validFormData,
      delivery: {
        ...validFormData.delivery,
        address: {
          ...validFormData.delivery.address,
          postalCode: '123456',
        },
      },
    };
    
    await fillForm(user, invalidData);
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    expect(await screen.findByText(/Please enter a valid postal code/i)).toBeInTheDocument();
  });

  it('validates future date for delivery', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Fill form with past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const invalidData = {
      ...validFormData,
      delivery: {
        ...validFormData.delivery,
        date: pastDate.toISOString().split('T')[0],
      },
    };
    
    await fillForm(user, invalidData);
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    expect(await screen.findByText(/Delivery date must be in the future/i)).toBeInTheDocument();
  });

  it('switches between delivery and pickup options', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Check initial delivery form
    expect(screen.getByText(/Delivery Address/i)).toBeInTheDocument();
    
    // Switch to pickup
    await user.click(screen.getByLabelText(/Store Pickup/i));
    
    // Check pickup form is shown
    expect(screen.getByText(/Pickup Information/i)).toBeInTheDocument();
    expect(screen.getByText(/1208 Crescent St, Montreal, Quebec H3G 2A9/i)).toBeInTheDocument();
    
    // Switch back to delivery
    await user.click(screen.getByLabelText(/Home Delivery/i));
    
    // Check delivery form is shown again
    expect(screen.getByText(/Delivery Address/i)).toBeInTheDocument();
  });

  it('successfully submits form with valid data', async () => {
    const user = userEvent.setup();
    renderCheckoutForm();

    // Fill form with valid data
    await fillForm(user);
    
    // Submit form
    await user.click(screen.getByText(/Pay with Stripe/i));
    
    // Check that no validation errors are shown
    await waitFor(() => {
      expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();
    });
  });
});
