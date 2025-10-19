'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Debug logging toggle for i18n. Enable by setting NEXT_PUBLIC_I18N_DEBUG=1
const I18N_DEBUG = process.env.NEXT_PUBLIC_I18N_DEBUG === '1';
const logI18n = (...args: any[]) => {
  if (I18N_DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[i18n]', ...args);
  }
};

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.shop': 'Shop',
    'nav.occasions': 'Occasions',
    'nav.plants': 'Plants',
    'nav.gift': 'Gift',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',
    'nav.signIn': 'Sign In',
    'nav.signUp': 'Sign Up',
    'nav.signOut': 'Sign Out',
    'nav.cart': 'Cart',
    'nav.search': 'Search',
    
    // Shop categories
    'shop.rose': 'Rose',
    'shop.bouquet': 'Bouquet',
    'shop.bouquetInVase': 'Bouquet in Vase',
    'shop.indoorPlants': 'Indoor Plants',
    'shop.orchid': 'Orchid',
    'shop.fruitBasket': 'Fruit Basket',
    'shop.flowersBox': 'Flowers Box',
    
    // Occasions
    'occasions.birthday': 'Birthday',
    'occasions.anniversary': 'Anniversary',
    'occasions.loveRomantic': 'Love & Romantic',
    'occasions.getWellSoon': 'Get Well Soon',
    'occasions.wedding': 'Wedding',
    'occasions.prom': 'Prom',
    'occasions.congratulations': 'Congratulations',
    'occasions.newBaby': 'New Baby',
    'occasions.grandOpening': 'Grand Opening',
    'occasions.sympathy': 'Sympathy',
    'occasions.wreaths': 'Wreaths',
    'occasions.casketSprays': 'Casket Sprays',
    'occasions.sympathyBouquets': 'Sympathy Bouquets',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.welcome': 'Welcome to',
    'common.discoverCollection': 'Discover our beautiful collection of fresh flowers and arrangements',
    'common.shopNow': 'Shop Now',
    'common.timeLeftForNext': 'Time left for next',
    'common.dayDelivery': 'day delivery',
    'common.hours': 'HOURS',
    'common.minutes': 'MINUTES',
    'common.seconds': 'SECONDS',
    
    // About page
    'about.title': 'About Atelier Floral',
    'about.subtitle': 'Where flowers meet art, coffee, and community in the heart of Montreal',
    'about.locationText': 'Located at 1208 Rue Crescent in Montreal, our flower store is more than just a flower shop — it\'s a creative space where custom floral design, a cozy café, and a vibrant art gallery come together.',
    'about.passionText': 'Every bouquet we make is handcrafted and personalized, turning flowers into emotion — bold, delicate, wild, or elegant — just like you.',
    'about.experienceText': 'Whether you\'re picking up a gift, grabbing a coffee, or exploring local art, our warm, wood-filled space is your new favorite stop. Come feel the vibe, take a breath, and let flowers do the talking.',
    'about.tagline': 'Flowers with soul. Moments with meaning.',
    'about.customDesign': 'Custom Design',
    'about.customDesignDesc': 'Handcrafted bouquets',
    'about.cozyCafe': 'Cozy Café',
    'about.cozyCafeDesc': 'Fresh coffee & treats',
    'about.artGallery': 'Art Gallery',
    'about.artGalleryDesc': 'Local artists featured',
    'about.montrealLocation': 'Montreal Location',
    'about.montrealLocationDesc': '1208 Rue Crescent',
    'about.visitStore': 'Visit Our Store',
    'about.visitStoreDesc': 'Come experience our beautiful space and let us help you find the perfect flowers',
    'about.address': 'Address',
    'about.addressText': '1208 Rue Crescent\nMontréal, QC H3G 2A9\nCanada',
    'about.storeHours': 'Store Hours',
    'about.mondayFriday': 'Monday-Friday: 10:00 AM - 7:30 PM',
    'about.saturday': 'Saturday: 10:30 AM - 7:30 PM',
    'about.sunday': 'Sunday: 10:30 AM - 5:30 PM',
    'about.phone': 'Phone',
    'about.phoneNumber': '(438) 282-1208',
    'about.email': 'Email',
    'about.emailAddress': '1208crescent@gmail.com',
    'about.parkingInfo': 'Parking Information',
    'about.parkingText': 'Free parking is available for our customers in the store.',
    'about.publicTransit': 'Public Transit',
    'about.publicTransitText': 'Easily accessible by public transportation. Multiple bus routes and metro stations nearby.',
    'about.footerTitle': 'Flower Store',
    'about.footerAddress': '1208 Rue Crescent, Montréal, QC H3G 2A9, Canada',
    'about.footerTagline': 'Flowers with soul. Moments with meaning.',
    
    // Home page
    'home.title': 'Welcome to FLORIST',
    'home.subtitle': 'Discover our beautiful collection of fresh flowers and arrangements',
    'home.shopNow': 'Shop Now',
    'home.timeLeftForNext': 'Time left for next',
    'home.dayDelivery': 'day delivery',
    'home.hours': 'HOURS',
    'home.minutes': 'MINUTES',
    'home.seconds': 'SECONDS',
    'home.bestSellers': 'Best Sellers Collection',
    'home.bestSellersDescription': 'Explore our most loved arrangements, handpicked favorites that bring joy to every occasion.',
    'home.viewBestSellers': 'View Best Sellers',
    'home.ourStory': 'Our Story',
    'home.ourStoryDescription': 'Discover the passion and craftsmanship behind every bouquet we create. Family-owned, locally loved.',
    'home.aboutUs': 'About Us',
    'home.loadingProducts': 'Loading products...',
    'home.retry': 'Retry',
    'home.noProductsFound': 'No products found for this shop.',
    'home.noProductsMatch': 'No products match your current filters. Try adjusting your filter criteria.',
    'home.clearFilters': 'Clear Filters',
    'home.previous': 'Previous',
    'home.next': 'Next',
    
    // Cart page
    'cart.title': 'Shopping Cart',
    'cart.itemsInCart': 'items in your cart',
    'cart.itemInCart': 'item in your cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyDescription': 'Looks like you haven\'t added any items to your cart yet.',
    'cart.continueShopping': 'Continue Shopping',
    'cart.backToCart': '← Back to Cart',
    'cart.checkout': 'Checkout',
    'cart.signedInAs': 'Signed in as:',
    'cart.each': 'each',
    'cart.size': 'Size:',
    'cart.clearCart': 'Clear Cart',
    'cart.orderSummary': 'Order Summary',
    'cart.items': 'Items',
    'cart.shipping': 'Shipping',
    'cart.shippingCalculated': 'Calculated at checkout',
    'cart.tax': 'Tax',
    'cart.taxCalculated': 'Calculated at checkout',
    'cart.total': 'Total',
    'cart.proceedToCheckout': 'Proceed to Checkout',
    'cart.secureCheckout': 'Secure checkout powered by our payment partners',
    'cart.emptyAlert': 'Your cart is empty!',
    'cart.signInRequired': 'Please sign in to proceed with checkout!',
    'cart.deliveryOptions': 'Delivery Options',
    'cart.delivery': 'Delivery',
    'cart.pickup': 'Pickup',
    'cart.postalCode': 'Postal Code',
    'cart.calculatingDelivery': 'Calculating delivery fee',
    'cart.pickupAddress': '1208 Crescent St, Montreal, Quebec H3G 2A9',
    'cart.deliveryFee': 'Delivery Fee',
    'cart.pickupFee': 'Pickup Fee',
    'cart.free': 'Free',
    'cart.enterPostalCodeForDelivery': 'Please enter a postal code to calculate delivery fee',
    
    // Checkout form
    'checkout.orderSummary': 'Order Summary',
    'checkout.subtotal': 'Subtotal',
    'checkout.deliveryFee': 'Delivery Fee',
    'checkout.pickupFee': 'Pickup Fee',
    'checkout.free': 'Free',
    'checkout.tax': 'Tax',
    'checkout.finalTotal': 'Final Total',
    'checkout.calculatingFees': 'Calculating fees',
    
    // Orders page
    'orders.title': 'My Orders',
    'orders.subtitle': 'View and track your flower orders',
    'orders.loading': 'Loading orders...',
    'orders.error': 'Failed to fetch orders',
    'orders.tryAgain': 'Try Again',
    'orders.orderHistory': 'Order History',
    'orders.noOrders': 'No orders yet',
    'orders.noOrdersDescription': 'Start shopping to see your orders here.',
    'orders.startShopping': 'Start Shopping',
    'orders.orderNumber': 'Order #',
    'orders.placedOn': 'Placed on',
    'orders.items': 'Items',
    'orders.subtotal': 'Subtotal',
    'orders.tax': 'Tax',
    'orders.deliveryFee': 'Delivery Fee',
    'orders.total': 'Total',
    'orders.deliveryInformation': 'Delivery Information',
    'orders.method': 'Method',
    'orders.contact': 'Contact',
    'orders.specialInstructions': 'Special Instructions',
    'orders.delivery': 'Delivery',
    'orders.pickup': 'Pickup',
    'orders.status': {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    },
    
    // Checkout form
    'checkout.emptyCart': 'Your cart is empty. Add some items to proceed with checkout.',
    'checkout.deliveryMethod': 'Delivery Method',
    'checkout.deliveryMethodDesc': 'Choose how you\'d like to receive your order',
    'checkout.homeDelivery': 'Home Delivery',
    'checkout.storePickup': 'Store Pickup',
    'checkout.recipientInfo': 'Recipient Information',
    'checkout.recipientInfoDesc': 'Who will receive this order?',
    'checkout.recipientName': 'Recipient Name',
    'checkout.recipientPhone': 'Recipient Phone',
    'checkout.recipientEmail': 'Recipient Email',
    'checkout.occasionCard': 'Occasion & Card Message',
    'checkout.occasionCardDesc': 'Add a personal touch to your order',
    'checkout.occasion': 'Occasion',
    'checkout.selectOccasion': 'Select an occasion',
    'checkout.birthday': 'Birthday',
    'checkout.anniversary': 'Anniversary',
    'checkout.wedding': 'Wedding',
    'checkout.sympathy': 'Sympathy',
    'checkout.congratulations': 'Congratulations',
    'checkout.getWell': 'Get Well',
    'checkout.thankYou': 'Thank You',
    'checkout.other': 'Other',
    'checkout.cardMessage': 'Card Message',
    'checkout.cardMessagePlaceholder': 'Enter your card message here...',
    'checkout.contactInfo': 'Your Contact Information',
    'checkout.contactInfoDesc': 'We\'ll use this to contact you about the order',
    'checkout.yourPhone': 'Your Phone Number',
    'checkout.yourEmail': 'Your Email Address',
    'checkout.deliveryAddress': 'Delivery Address',
    'checkout.deliveryAddressDesc': 'Where should we deliver your order?',
    'checkout.company': 'Company/Business Name (Optional)',
    'checkout.companyPlaceholder': 'Company Name',
    'checkout.street': 'Street Address',
    'checkout.streetPlaceholder': '123 Main Street',
    'checkout.city': 'City',
    'checkout.cityPlaceholder': 'Montreal',
    'checkout.province': 'Province',
    'checkout.selectProvince': 'Select Province',
    'checkout.quebec': 'Quebec',
    'checkout.postalCode': 'Postal Code',
    'checkout.postalCodePlaceholder': 'H4P 1G6',
    'checkout.deliveryDate': 'Delivery Date',
    'checkout.deliveryTime': 'Delivery Time',
    'checkout.selectDeliveryTime': 'Select delivery time',
    'checkout.deliveryInstructions': 'Delivery Instructions',
    'checkout.deliveryInstructionsPlaceholder': 'Any special delivery instructions...',
    'checkout.buzzerCode': 'Buzzer/Entry Code',
    'checkout.buzzerCodePlaceholder': 'Enter buzzer or entry code if needed',
    'checkout.pickupInfo': 'Pickup Information',
    'checkout.pickupInfoDesc': 'When would you like to pick up your order?',
    'checkout.pickupLocation': 'Pickup Location',
    'checkout.mainStore': 'Main Store',
    'checkout.pickupDate': 'Pickup Date',
    'checkout.pickupTime': 'Pickup Time',
    'checkout.selectPickupTime': 'Select pickup time',
    'checkout.specialInstructions': 'Special Instructions',
    'checkout.specialInstructionsDesc': 'Any special requests or notes for your order?',
    'checkout.specialInstructionsPlaceholder': 'Please leave at front door, ring doorbell, etc.',
    'checkout.total': 'Total',
    'checkout.payWithStripe': 'Pay with Stripe',
    'checkout.timeSlots': {
      '09:00': '9:00 AM',
      '10:00': '10:00 AM',
      '11:00': '11:00 AM',
      '12:00': '12:00 PM',
      '13:00': '1:00 PM',
      '14:00': '2:00 PM',
      '15:00': '3:00 PM',
      '16:00': '4:00 PM',
      '17:00': '5:00 PM',
      '18:00': '6:00 PM'
    },
    'checkout.validation': {
      'recipientNameRequired': 'Recipient name is required',
      'recipientPhoneRequired': 'Recipient phone number is required',
      'recipientEmailRequired': 'Recipient email is required',
      'validRecipientEmail': 'Please enter a valid recipient email address',
      'validContactEmail': 'Please enter a valid contact email address',
      'validRecipientPhone': 'Please enter a valid recipient phone number',
      'validContactPhone': 'Please enter a valid contact phone number',
      'contactPhoneRequired': 'Contact phone is required',
      'contactEmailRequired': 'Contact email is required',
      'streetRequired': 'Street address is required for delivery',
      'cityRequired': 'City is required for delivery',
      'provinceRequired': 'Province is required for delivery',
      'postalCodeRequired': 'Postal code is required for delivery',
      'validPostalCode': 'Please enter a valid postal code',
      'deliveryDateRequired': 'Delivery date is required',
      'deliveryTimeRequired': 'Delivery time is required',
      'deliveryDateFuture': 'Delivery date must be in the future',
      'pickupDateRequired': 'Pickup date is required',
      'pickupTimeRequired': 'Pickup time is required',
      'pickupDateFuture': 'Pickup date must be in the future'
    },
    
    // Product page
    'product.loading': 'Loading product...',
    'product.goBack': 'Go Back',
    'product.color': 'Color:',
    'product.selectTier': 'Select Tier:',
    'product.quantity': 'Quantity',
    'product.inStock': 'In stock',
    'product.notAvailable': 'Not available',
    'product.addToCart': 'Add to cart',
    'product.adding': 'Adding...',
    'product.delivery': 'Delivery',
    'product.deliveryDescription': 'Click here to find out if we deliver to you!',
    'product.deliveryFAQ': 'Want to learn more about how your delivery will be handled? Visit our FAQ.',
    'product.substitutionPolicy': 'Substitution policy',
    'product.substitutionDescription': 'We reserve the right to substitute flowers of equal or greater value if the requested flowers are not available.',
    'product.returnsRefunds': 'Returns & refunds',
    'product.returnsDescription': 'We offer a 100% satisfaction guarantee. If you\'re not completely satisfied, contact us within 24 hours.',
    'product.detailsCare': 'Details & care',
    'product.categories': 'Categories:',
    'product.stock': 'Stock:',
    'product.tags': 'Tags:',
    'product.filterBySize': 'Filter by Size:',
    'product.allSizes': 'All Sizes',
    'product.defaultDescription': 'Let one of our skilled designers create a one of a kind masterpiece for you. It will arrive arranged in a simple container, gift wrapped with attention.',
    
    // Contact page
    'contact.title': 'About Atelier Floral',
    'contact.subtitle': 'Where flowers meet art, coffee, and community in the heart of Montreal',
    'contact.getInTouch': 'Get in Touch',
    'contact.phone': 'Phone',
    'contact.phoneNumber': '(438) 282-1208',
    'contact.email': 'Email',
    'contact.emailAddress': '1208crescent@gmail.com',
    'contact.address': 'Address',
    'contact.addressText': '1208 Rue Crescent\nMontréal, QC H3G 2A9\nCanada',
    'contact.storeHours': 'Store Hours',
    'contact.mondayFriday': 'Monday-Friday: 10:00 AM - 7:30 PM',
    'contact.saturday': 'Saturday: 10:30 AM - 7:30 PM',
    'contact.sunday': 'Sunday: 10:30 AM - 5:30 PM',
    'contact.followUs': 'Follow Us',
    'contact.sendMessage': 'Send Us a Message',
    'contact.name': 'Name',
    'contact.nameRequired': 'Name *',
    'contact.emailRequired': 'Email *',
    'contact.phoneOptional': 'Phone',
    'contact.subject': 'Subject',
    'contact.subjectRequired': 'Subject *',
    'contact.selectSubject': 'Select a subject',
    'contact.generalInquiry': 'General Inquiry',
    'contact.orderStatus': 'Order Status',
    'contact.productInformation': 'Product Information',
    'contact.feedback': 'Feedback',
    'contact.other': 'Other',
    'contact.message': 'Message',
    'contact.messageRequired': 'Message *',
    'contact.sendMessageButton': 'Send Message',
    'contact.thankYou': 'Thank you for your message. We will get back to you soon!',
    'contact.error': 'Failed to submit form. Please try again later.',
    
    // Auth
    'auth.createAccount': 'Create your account',
    'auth.signInToAccount': 'Sign in to your account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    'auth.signIn': 'Sign in',
    'auth.signUp': 'Sign up',
    'auth.fullName': 'Full Name',
    'auth.emailAddress': 'Email address',
    'auth.password': 'Password',
    'auth.processing': 'Processing...',
    'auth.createAccountButton': 'Create Account',
    'auth.signInButton': 'Sign In',
    'auth.accountCreatedSuccess': 'Account created successfully! Please check your email and sign in.',
    'auth.unexpectedError': 'An unexpected error occurred',
    'auth.termsOfService': 'Terms of Service',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.bySigningUp': 'By signing up, you agree to our',
    'auth.and': 'and',
    
    // Language
    'language.english': 'English',
    'language.french': 'Français',
    'language.switch': 'Switch Language',
  },
  fr: {
    // Navigation
    'nav.shop': 'Boutique',
    'nav.occasions': 'Occasions',
    'nav.plants': 'Plantes',
    'nav.gift': 'Cadeau',
    'nav.about': 'À Propos',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Tableau de Bord',
    'nav.orders': 'Commandes',
    'nav.profile': 'Profil',
    'nav.signIn': 'Se Connecter',
    'nav.signUp': "S'inscrire",
    'nav.signOut': 'Se Déconnecter',
    'nav.cart': 'Panier',
    'nav.search': 'Rechercher',
    
    // Shop categories
    'shop.rose': 'Rose',
    'shop.bouquet': 'Bouquet',
    'shop.bouquetInVase': 'Bouquet en Vase',
    'shop.indoorPlants': 'Plantes d\'Intérieur',
    'shop.orchid': 'Orchidée',
    'shop.fruitBasket': 'Panier de Fruits',
    'shop.flowersBox': 'Boîte de Fleurs',
    
    // Occasions
    'occasions.birthday': 'Anniversaire',
    'occasions.anniversary': 'Anniversaire de Mariage',
    'occasions.loveRomantic': 'Amour & Romantique',
    'occasions.getWellSoon': 'Rétablissement',
    'occasions.wedding': 'Mariage',
    'occasions.prom': 'Bal de Finissants',
    'occasions.congratulations': 'Félicitations',
    'occasions.newBaby': 'Nouveau Bébé',
    'occasions.grandOpening': 'Ouverture',
    'occasions.sympathy': 'Sympathie',
    'occasions.wreaths': 'Couronnes',
    'occasions.casketSprays': 'Gerbes de Cercueil',
    'occasions.sympathyBouquets': 'Bouquets de Sympathie',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Sauvegarder',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.add': 'Ajouter',
    'common.remove': 'Retirer',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.submit': 'Soumettre',
    'common.confirm': 'Confirmer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.welcome': 'Bienvenue chez',
    'common.discoverCollection': 'Découvrez notre belle collection de fleurs fraîches et d\'arrangements',
    'common.shopNow': 'Acheter Maintenant',
    'common.timeLeftForNext': 'Temps restant pour la prochaine',
    'common.dayDelivery': 'livraison du jour',
    'common.hours': 'HEURES',
    'common.minutes': 'MINUTES',
    'common.seconds': 'SECONDES',
    
    // Home page
    'home.title': 'Bienvenue chez FLORIST',
    'home.subtitle': 'Découvrez notre belle collection de fleurs fraîches et d\'arrangements',
    'home.shopNow': 'Acheter Maintenant',
    'home.timeLeftForNext': 'Temps restant pour la prochaine',
    'home.dayDelivery': 'livraison du jour',
    'home.hours': 'HEURES',
    'home.minutes': 'MINUTES',
    'home.seconds': 'SECONDES',
    'home.bestSellers': 'Collection Meilleures Ventes',
    'home.bestSellersDescription': 'Explorez nos arrangements les plus aimés, nos favoris soigneusement sélectionnés qui apportent de la joie à chaque occasion.',
    'home.viewBestSellers': 'Voir les Meilleures Ventes',
    'home.ourStory': 'Notre Histoire',
    'home.ourStoryDescription': 'Découvrez la passion et l\'artisanat derrière chaque bouquet que nous créons. Familial, aimé localement.',
    'home.aboutUs': 'À Propos',
    'home.loadingProducts': 'Chargement des produits...',
    'home.retry': 'Réessayer',
    'home.noProductsFound': 'Aucun produit trouvé pour cette boutique.',
    'home.noProductsMatch': 'Aucun produit ne correspond à vos filtres actuels. Essayez d\'ajuster vos critères de filtrage.',
    'home.clearFilters': 'Effacer les Filtres',
    'home.previous': 'Précédent',
    'home.next': 'Suivant',
    
    // Cart page
    'cart.title': 'Panier d\'Achat',
    'cart.itemsInCart': 'articles dans votre panier',
    'cart.itemInCart': 'article dans votre panier',
    'cart.empty': 'Votre panier est vide',
    'cart.emptyDescription': 'Il semble que vous n\'ayez pas encore ajouté d\'articles à votre panier.',
    'cart.continueShopping': 'Continuer les Achats',
    'cart.backToCart': '← Retour au Panier',
    'cart.checkout': 'Commande',
    'cart.signedInAs': 'Connecté en tant que :',
    'cart.each': 'chacun',
    'cart.size': 'Taille :',
    'cart.clearCart': 'Vider le Panier',
    'cart.orderSummary': 'Résumé de la Commande',
    'cart.items': 'Articles',
    'cart.shipping': 'Livraison',
    'cart.shippingCalculated': 'Calculé à la commande',
    'cart.tax': 'Taxe',
    'cart.taxCalculated': 'Calculé à la commande',
    'cart.total': 'Total',
    'cart.proceedToCheckout': 'Procéder à la Commande',
    'cart.secureCheckout': 'Commande sécurisée alimentée par nos partenaires de paiement',
    'cart.emptyAlert': 'Votre panier est vide !',
    'cart.signInRequired': 'Veuillez vous connecter pour procéder à la commande !',
    
    // Orders page
    'orders.title': 'Mes Commandes',
    'orders.subtitle': 'Consultez et suivez vos commandes de fleurs',
    'orders.loading': 'Chargement des commandes...',
    'orders.error': 'Échec du chargement des commandes',
    'orders.tryAgain': 'Réessayer',
    'orders.orderHistory': 'Historique des Commandes',
    'orders.noOrders': 'Aucune commande pour le moment',
    'orders.noOrdersDescription': 'Commencez à magasiner pour voir vos commandes ici.',
    'orders.startShopping': 'Commencer à Magasiner',
    'orders.orderNumber': 'Commande #',
    'orders.placedOn': 'Passée le',
    'orders.items': 'Articles',
    'orders.subtotal': 'Sous-total',
    'orders.tax': 'Taxe',
    'orders.deliveryFee': 'Frais de Livraison',
    'orders.total': 'Total',
    'orders.deliveryInformation': 'Information de Livraison',
    'orders.method': 'Méthode',
    'orders.contact': 'Contact',
    'orders.specialInstructions': 'Instructions Spéciales',
    'orders.delivery': 'Livraison',
    'orders.pickup': 'Ramassage',
    'orders.status': {
      'pending': 'En Attente',
      'confirmed': 'Confirmée',
      'preparing': 'En Préparation',
      'ready': 'Prête',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    },
    
    // Checkout form
    'checkout.emptyCart': 'Votre panier est vide. Ajoutez des articles pour procéder à la commande.',
    'checkout.deliveryMethod': 'Méthode de Livraison',
    'checkout.deliveryMethodDesc': 'Choisissez comment vous souhaitez recevoir votre commande',
    'checkout.homeDelivery': 'Livraison à Domicile',
    'checkout.storePickup': 'Ramassage en Magasin',
    'checkout.recipientInfo': 'Information du Destinataire',
    'checkout.recipientInfoDesc': 'Qui recevra cette commande ?',
    'checkout.recipientName': 'Nom du Destinataire',
    'checkout.recipientPhone': 'Téléphone du Destinataire',
    'checkout.recipientEmail': 'Courriel du Destinataire',
    'checkout.occasionCard': 'Occasion et Message de Carte',
    'checkout.occasionCardDesc': 'Ajoutez une touche personnelle à votre commande',
    'checkout.occasion': 'Occasion',
    'checkout.selectOccasion': 'Sélectionner une occasion',
    'checkout.birthday': 'Anniversaire',
    'checkout.anniversary': 'Anniversaire de Mariage',
    'checkout.wedding': 'Mariage',
    'checkout.sympathy': 'Sympathie',
    'checkout.congratulations': 'Félicitations',
    'checkout.getWell': 'Rétablissement',
    'checkout.thankYou': 'Merci',
    'checkout.other': 'Autre',
    'checkout.cardMessage': 'Message de Carte',
    'checkout.cardMessagePlaceholder': 'Entrez votre message de carte ici...',
    'checkout.contactInfo': 'Vos Informations de Contact',
    'checkout.contactInfoDesc': 'Nous utiliserons ceci pour vous contacter au sujet de la commande',
    'checkout.yourPhone': 'Votre Numéro de Téléphone',
    'checkout.yourEmail': 'Votre Adresse Courriel',
    'checkout.deliveryAddress': 'Adresse de Livraison',
    'checkout.deliveryAddressDesc': 'Où devons-nous livrer votre commande ?',
    'checkout.company': 'Nom de l\'Entreprise (Optionnel)',
    'checkout.companyPlaceholder': 'Nom de l\'Entreprise',
    'checkout.street': 'Adresse Civique',
    'checkout.streetPlaceholder': '123 Rue Principale',
    'checkout.city': 'Ville',
    'checkout.cityPlaceholder': 'Montréal',
    'checkout.province': 'Province',
    'checkout.selectProvince': 'Sélectionner la Province',
    'checkout.quebec': 'Québec',
    'checkout.postalCode': 'Code Postal',
    'checkout.postalCodePlaceholder': 'H4P 1G6',
    'checkout.deliveryDate': 'Date de Livraison',
    'checkout.deliveryTime': 'Heure de Livraison',
    'checkout.selectDeliveryTime': 'Sélectionner l\'heure de livraison',
    'checkout.deliveryInstructions': 'Instructions de Livraison',
    'checkout.deliveryInstructionsPlaceholder': 'Toute instruction spéciale de livraison...',
    'checkout.buzzerCode': 'Code d\'Interphone/Entrée',
    'checkout.buzzerCodePlaceholder': 'Entrez le code d\'interphone ou d\'entrée si nécessaire',
    'checkout.pickupInfo': 'Information de Ramassage',
    'checkout.pickupInfoDesc': 'Quand souhaitez-vous récupérer votre commande ?',
    'checkout.pickupLocation': 'Lieu de Ramassage',
    'checkout.mainStore': 'Magasin Principal',
    'checkout.pickupDate': 'Date de Ramassage',
    'checkout.pickupTime': 'Heure de Ramassage',
    'checkout.selectPickupTime': 'Sélectionner l\'heure de ramassage',
    'checkout.specialInstructions': 'Instructions Spéciales',
    'checkout.specialInstructionsDesc': 'Des demandes spéciales ou des notes pour votre commande ?',
    'checkout.specialInstructionsPlaceholder': 'Veuillez laisser à la porte d\'entrée, sonner, etc.',
    'checkout.orderSummary': 'Résumé de la Commande',
    'checkout.total': 'Total',
    'checkout.payWithStripe': 'Payer avec Stripe',
    'checkout.timeSlots': {
      '09:00': '9h00',
      '10:00': '10h00',
      '11:00': '11h00',
      '12:00': '12h00',
      '13:00': '13h00',
      '14:00': '14h00',
      '15:00': '15h00',
      '16:00': '16h00',
      '17:00': '17h00',
      '18:00': '18h00'
    },
    'checkout.validation': {
      'recipientNameRequired': 'Le nom du destinataire est requis',
      'recipientPhoneRequired': 'Le numéro de téléphone du destinataire est requis',
      'recipientEmailRequired': 'Le courriel du destinataire est requis',
      'validRecipientEmail': 'Veuillez entrer une adresse courriel valide pour le destinataire',
      'validContactEmail': 'Veuillez entrer une adresse courriel de contact valide',
      'validRecipientPhone': 'Veuillez entrer un numéro de téléphone valide pour le destinataire',
      'validContactPhone': 'Veuillez entrer un numéro de téléphone de contact valide',
      'contactPhoneRequired': 'Le téléphone de contact est requis',
      'contactEmailRequired': 'Le courriel de contact est requis',
      'streetRequired': 'L\'adresse civique est requise pour la livraison',
      'cityRequired': 'La ville est requise pour la livraison',
      'provinceRequired': 'La province est requise pour la livraison',
      'postalCodeRequired': 'Le code postal est requis pour la livraison',
      'validPostalCode': 'Veuillez entrer un code postal valide',
      'deliveryDateRequired': 'La date de livraison est requise',
      'deliveryTimeRequired': 'L\'heure de livraison est requise',
      'deliveryDateFuture': 'La date de livraison doit être dans le futur',
      'pickupDateRequired': 'La date de ramassage est requise',
      'pickupTimeRequired': 'L\'heure de ramassage est requise',
      'pickupDateFuture': 'La date de ramassage doit être dans le futur'
    },
    
    // Product page
    'product.loading': 'Chargement du produit...',
    'product.goBack': 'Retour',
    'product.color': 'Couleur :',
    'product.selectTier': 'Sélectionner le Niveau :',
    'product.quantity': 'Quantité',
    'product.inStock': 'En stock',
    'product.notAvailable': 'Non disponible',
    'product.addToCart': 'Ajouter au panier',
    'product.adding': 'Ajout en cours...',
    'product.delivery': 'Livraison',
    'product.deliveryDescription': 'Cliquez ici pour savoir si nous livrons chez vous !',
    'product.deliveryFAQ': 'Vous voulez en savoir plus sur la façon dont votre livraison sera gérée ? Consultez notre FAQ.',
    'product.substitutionPolicy': 'Politique de substitution',
    'product.substitutionDescription': 'Nous nous réservons le droit de substituer des fleurs de valeur égale ou supérieure si les fleurs demandées ne sont pas disponibles.',
    'product.returnsRefunds': 'Retours et remboursements',
    'product.returnsDescription': 'Nous offrons une garantie de satisfaction à 100 %. Si vous n\'êtes pas complètement satisfait, contactez-nous dans les 24 heures.',
    'product.detailsCare': 'Détails et soins',
    'product.categories': 'Catégories :',
    'product.stock': 'Stock :',
    'product.tags': 'Étiquettes :',
    'product.filterBySize': 'Filtrer par Taille :',
    'product.allSizes': 'Toutes les Tailles',
    'product.defaultDescription': 'Laissez un de nos designers qualifiés créer un chef-d\'œuvre unique pour vous. Il arrivera arrangé dans un simple contenant, emballé avec attention.',
    
    // Contact page
    'contact.title': 'À Propos d\'Atelier Floral',
    'contact.subtitle': 'Où les fleurs rencontrent l\'art, le café et la communauté au cœur de Montréal',
    'contact.getInTouch': 'Entrer en Contact',
    'contact.phone': 'Téléphone',
    'contact.phoneNumber': '(438) 282-1208',
    'contact.email': 'Courriel',
    'contact.emailAddress': '1208crescent@gmail.com',
    'contact.address': 'Adresse',
    'contact.addressText': '1208 Rue Crescent\nMontréal, QC H3G 2A9\nCanada',
    'contact.storeHours': 'Heures d\'Ouverture',
    'contact.mondayFriday': 'Lundi-Vendredi : 10h00 - 19h30',
    'contact.saturday': 'Samedi : 10h30 - 19h30',
    'contact.sunday': 'Dimanche : 10h30 - 17h30',
    'contact.followUs': 'Suivez-nous',
    'contact.sendMessage': 'Envoyez-nous un Message',
    'contact.name': 'Nom',
    'contact.nameRequired': 'Nom *',
    'contact.emailRequired': 'Courriel *',
    'contact.phoneOptional': 'Téléphone',
    'contact.subject': 'Sujet',
    'contact.subjectRequired': 'Sujet *',
    'contact.selectSubject': 'Sélectionner un sujet',
    'contact.generalInquiry': 'Demande générale',
    'contact.orderStatus': 'Statut de la commande',
    'contact.productInformation': 'Information sur le produit',
    'contact.feedback': 'Commentaires',
    'contact.other': 'Autre',
    'contact.message': 'Message',
    'contact.messageRequired': 'Message *',
    'contact.sendMessageButton': 'Envoyer le Message',
    'contact.thankYou': 'Merci pour votre message. Nous vous répondrons bientôt !',
    'contact.error': 'Échec de l\'envoi du formulaire. Veuillez réessayer plus tard.',
    
    // Auth
    'auth.createAccount': 'Créez votre compte',
    'auth.signInToAccount': 'Connectez-vous à votre compte',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte ?',
    'auth.dontHaveAccount': 'Vous n\'avez pas de compte ?',
    'auth.signIn': 'Se connecter',
    'auth.signUp': 'S\'inscrire',
    'auth.fullName': 'Nom complet',
    'auth.emailAddress': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.processing': 'Traitement en cours...',
    'auth.createAccountButton': 'Créer un compte',
    'auth.signInButton': 'Se connecter',
    'auth.accountCreatedSuccess': 'Compte créé avec succès ! Veuillez vérifier votre e-mail et vous connecter.',
    'auth.unexpectedError': 'Une erreur inattendue s\'est produite',
    'auth.termsOfService': 'Conditions d\'utilisation',
    'auth.privacyPolicy': 'Politique de confidentialité',
    'auth.bySigningUp': 'En vous inscrivant, vous acceptez nos',
    'auth.and': 'et',
    
    // About page
    'about.title': 'À Propos d\'Atelier Floral',
    'about.subtitle': 'Où les fleurs rencontrent l\'art, le café et la communauté au cœur de Montréal',
    'about.locationText': 'Situé au 1208 Rue Crescent à Montréal, notre boutique de fleurs est bien plus qu\'une simple boutique de fleurs — c\'est un espace créatif où se rencontrent le design floral personnalisé, un café chaleureux et une galerie d\'art dynamique.',
    'about.passionText': 'Chaque bouquet que nous créons est fait à la main et personnalisé, transformant les fleurs en émotion — audacieux, délicat, sauvage ou élégant — tout comme vous.',
    'about.experienceText': 'Que vous veniez chercher un cadeau, prendre un café ou explorer l\'art local, notre espace chaleureux et boisé est votre nouveau lieu de prédilection. Venez ressentir l\'ambiance, prenez une respiration et laissez les fleurs parler.',
    'about.tagline': 'Fleurs avec âme. Moments avec sens.',
    'about.customDesign': 'Design Personnalisé',
    'about.customDesignDesc': 'Bouquets faits à la main',
    'about.cozyCafe': 'Café Chaleureux',
    'about.cozyCafeDesc': 'Café frais et gourmandises',
    'about.artGallery': 'Galerie d\'Art',
    'about.artGalleryDesc': 'Artistes locaux présentés',
    'about.montrealLocation': 'Emplacement Montréal',
    'about.montrealLocationDesc': '1208 Rue Crescent',
    'about.visitStore': 'Visitez Notre Boutique',
    'about.visitStoreDesc': 'Venez découvrir notre magnifique espace et laissez-nous vous aider à trouver les fleurs parfaites',
    'about.address': 'Adresse',
    'about.addressText': '1208 Rue Crescent\nMontréal, QC H3G 2A9\nCanada',
    'about.storeHours': 'Heures d\'Ouverture',
    'about.mondayFriday': 'Lundi-Vendredi : 10h00 - 19h30',
    'about.saturday': 'Samedi : 10h30 - 19h30',
    'about.sunday': 'Dimanche : 10h30 - 17h30',
    'about.phone': 'Téléphone',
    'about.phoneNumber': '(438) 282-1208',
    'about.email': 'Courriel',
    'about.emailAddress': '1208crescent@gmail.com',
    'about.parkingInfo': 'Information de Stationnement',
    'about.parkingText': 'Le stationnement gratuit est disponible pour nos clients dans la boutique.',
    'about.publicTransit': 'Transport en Commun',
    'about.publicTransitText': 'Facilement accessible par les transports en commun. Plusieurs lignes d\'autobus et stations de métro à proximité.',
    'about.footerTitle': 'Boutique de Fleurs',
    'about.footerAddress': '1208 Rue Crescent, Montréal, QC H3G 2A9, Canada',
    'about.footerTagline': 'Fleurs avec âme. Moments avec sens.',
    
    // Language
    'language.english': 'English',
    'language.french': 'Français',
    'language.switch': 'Changer de Langue',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    
    // Load language from localStorage after mounting
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
        setLanguage(savedLanguage);
        logI18n('Loaded saved language from localStorage:', savedLanguage);
      } else {
        logI18n('No saved language in localStorage, defaulting to', 'en');
      }
    }
  }, []);

  // Save language to localStorage when it changes (only after mounting)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      logI18n('Persisted language to localStorage:', language);
    }
  }, [language, mounted]);

  const t = (key: string): string => {
    // During SSR or before mounting, always use English
    const currentLanguage = mounted ? language : 'en';
    logI18n('t()', { key, mounted, language, currentLanguage });

    const langDict: any = translations[currentLanguage];
    if (!langDict || typeof langDict !== 'object') {
      if (I18N_DEBUG || process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[i18n] Missing language dictionary', { currentLanguage });
      }
      return key;
    }

    // 1) Try direct flat-key lookup (supports 'nav.shop' stored as a single key)
    if (key in langDict && typeof langDict[key] === 'string') {
      const direct = langDict[key] as string;
      logI18n('t() direct hit', { key, result: direct });
      return direct;
    }

    // 2) Fall back to deep traversal for nested objects (e.g., orders.status.pending)
    const parts = key.split('.');
    let value: any = langDict;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        if (I18N_DEBUG || process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[i18n] Missing translation key', { key, failedAt: part, currentLanguage });
        }
        return key;
      }
    }

    const result = typeof value === 'string' ? value : key;
    logI18n('t() result', { key, result });
    return result;
  };

  const value = {
    language,
    setLanguage,
    t,
    mounted,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    console.error('useLanguage must be used within a LanguageProvider');
    // Return a fallback function that returns the key
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
      mounted: false
    };
  }
  return context;
};
