import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Heart, TrendingUp, Zap, Coffee, ShieldCheck, ChevronLeft, Minus, Plus, CreditCard, CheckCircle, Eye, Upload, MapPin } from 'lucide-react';
import { CartItem, ShopItem, Review } from '../types';

interface ShopProps {
  cart?: CartItem[];
  setCart?: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

// Helper to format Naira
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount);
};

// Demo Reviews Data
const DEMO_REVIEWS: Review[] = [
    { id: 'r1', user: 'Tunde A.', rating: 5, comment: 'Excellent quality, delivery was fast to Lagos.', date: '2023-10-12' },
    { id: 'r2', user: 'Chioma B.', rating: 4, comment: 'Good product but packaging could be better.', date: '2023-11-05' },
    { id: 'r3', user: 'Emeka K.', rating: 5, comment: 'Exactly as described. Will buy again.', date: '2023-12-01' }
];

const DEMO_ITEMS: ShopItem[] = [
  // Nutrition
  {
    id: '1',
    title: 'Organic Whey Protein',
    price: 45000,
    category: 'Nutrition',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=400',
    tag: 'Best Seller',
    description: 'High-quality organic whey protein sourced from grass-fed cows. Perfect for post-workout recovery and muscle building.',
    views: 120,
    reviews: DEMO_REVIEWS
  },
  {
    id: '2',
    title: 'Daily Multivitamin Complex',
    price: 22500,
    category: 'Nutrition',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    description: 'Complete daily multivitamin to support your immune system and energy levels.',
    views: 85,
    reviews: []
  },
  {
    id: '3',
    title: 'Green Superfood Blend',
    price: 38000,
    category: 'Nutrition',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
    tag: 'Vegan',
    description: 'A powerful blend of superfoods to detoxify and energize your body naturally.',
    views: 200,
    reviews: DEMO_REVIEWS
  },
  {
    id: '4',
    title: 'Electrolyte Hydration Mix',
    price: 18000,
    category: 'Nutrition',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    description: 'Stay hydrated during intense workouts with our electrolyte-rich mix.',
    views: 95,
    reviews: []
  },
  // Work-Life Balance & Wellness
  {
    id: '5',
    title: 'Ergonomic Standing Desk',
    price: 299000,
    category: 'Work-Life',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=400',
    tag: 'Ergo',
    description: 'Adjustable standing desk to improve posture and productivity while working from home.',
    views: 450,
    reviews: DEMO_REVIEWS
  },
  {
    id: '6',
    title: 'Premium Yoga Mat',
    price: 65000,
    category: 'Wellness',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&q=80&w=400',
    description: 'Non-slip, eco-friendly yoga mat for superior grip and comfort.',
    views: 310,
    reviews: []
  },
  {
    id: '7',
    title: 'Noise Cancelling Headphones',
    price: 249000,
    category: 'Work-Life',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    description: 'Block out distractions and focus on your work or workout with premium sound quality.',
    views: 520,
    reviews: DEMO_REVIEWS
  },
  {
    id: '8',
    title: 'Meditation Cushion Set',
    price: 55000,
    category: 'Wellness',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1591296538596-3c077d853df2?auto=format&fit=crop&q=80&w=400',
    description: 'Comfortable cushion set designed to support your posture during meditation.',
    views: 78,
    reviews: []
  },
  {
    id: '9',
    title: 'Blue Light Blocking Glasses',
    price: 35000,
    category: 'Work-Life',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400',
    description: 'Protect your eyes from digital strain with these stylish blue light blocking glasses.',
    views: 150,
    reviews: []
  },
  {
    id: '10',
    title: 'Smart Water Bottle',
    price: 45000,
    category: 'Wellness',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1602143407151-0111419516eb?auto=format&fit=crop&q=80&w=400',
    tag: 'Smart',
    description: 'Track your hydration automatically and get reminders to drink water.',
    views: 180,
    reviews: []
  }
];

export const Shop: React.FC<ShopProps> = ({ cart = [], setCart }) => {
  const [view, setView] = useState<'list' | 'product' | 'cart' | 'checkout'>('list');
  const [selectedProduct, setSelectedProduct] = useState<ShopItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [localItems, setLocalItems] = useState(DEMO_ITEMS);

  // New Review State
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Product View Qty State
  const [viewQty, setViewQty] = useState(1);

  // Checkout Form State
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Lagos'
  });

  const filteredItems = activeCategory === 'All' 
    ? localItems 
    : localItems.filter(item => item.category === activeCategory);

  const addToCart = (item: ShopItem, qty: number = 1) => {
    if (!setCart) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + qty } : c));
    } else {
      setCart([...cart, { ...item, quantity: qty }]);
    }
    setView('cart'); // Immediate redirect to cart
  };

  const removeFromCart = (id: string) => {
    if (!setCart) return;
    setCart(cart.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    if (!setCart) return;
    setCart(cart.map(c => {
      if (c.id === id) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    }));
  };

  const handleProductClick = (item: ShopItem) => {
    setSelectedProduct(item);
    setView('product');
    setViewQty(1); // Reset quantity
    // Simulate view increment
    setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, views: i.views + 1 } : i));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newReviewText.trim()) return;
    
    const newReview: Review = {
        id: Math.random().toString(),
        user: 'You',
        rating: newReviewRating,
        comment: newReviewText,
        date: new Date().toISOString().split('T')[0]
    };

    const updatedProduct = { 
        ...selectedProduct, 
        reviews: [newReview, ...selectedProduct.reviews] 
    };

    // Update local state
    setLocalItems(prev => prev.map(i => i.id === selectedProduct.id ? updatedProduct : i));
    setSelectedProduct(updatedProduct);
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // -- VIEWS --

  const ProductView = () => (
    <div className="animate-in slide-in-from-right duration-300">
        <button onClick={() => setView('list')} className="mb-4 flex items-center text-slate-500 hover:text-primary">
            <ChevronLeft className="w-5 h-5" /> Back to Shop
        </button>
        {selectedProduct && (
            <div className="space-y-6">
                <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                    <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-64 object-cover" />
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedProduct.title}</h2>
                             <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {selectedProduct.category}
                             </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                             <div className="flex items-center text-amber-500 gap-1">
                                 <Star className="w-4 h-4 fill-current" />
                                 <span className="font-bold">{selectedProduct.rating}</span>
                             </div>
                             <div className="flex items-center gap-1">
                                 <Eye className="w-4 h-4" />
                                 <span>{selectedProduct.views + 1} views</span>
                             </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                            {selectedProduct.description}
                        </p>

                        <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 font-bold uppercase">Price</span>
                                <span className="text-2xl font-black text-primary">{formatNaira(selectedProduct.price * viewQty)}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                    <button onClick={() => setViewQty(Math.max(1, viewQty - 1))} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                                    <span className="w-10 text-center font-bold">{viewQty}</span>
                                    <button onClick={() => setViewQty(viewQty + 1)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>

                                <button 
                                    onClick={() => { addToCart(selectedProduct, viewQty); }}
                                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <ShoppingBag className="w-5 h-5" /> Add to Bag
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Reviews ({selectedProduct.reviews.length})</h3>
                    
                    {/* Add Review */}
                    <form onSubmit={handleSubmitReview} className="mb-6 bg-white dark:bg-card p-4 rounded-xl shadow-sm">
                        <p className="text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Write a review</p>
                        <div className="flex gap-1 mb-3">
                            {[1,2,3,4,5].map(r => (
                                <button key={r} type="button" onClick={() => setNewReviewRating(r)}>
                                    <Star className={`w-5 h-5 ${r <= newReviewRating ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={3}
                        />
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Post Review</button>
                    </form>

                    <div className="space-y-4">
                        {selectedProduct.reviews.length > 0 ? selectedProduct.reviews.map(review => (
                            <div key={review.id} className="border-b border-slate-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm">{review.user}</span>
                                    <span className="text-xs text-slate-400">{review.date}</span>
                                </div>
                                <div className="flex text-amber-500 gap-0.5 mb-2">
                                     {Array.from({length: 5}).map((_, i) => (
                                         <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                                     ))}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-sm italic">No reviews yet.</p>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const CartView = () => (
    <div className="animate-in slide-in-from-right duration-300">
        <button onClick={() => setView('list')} className="mb-4 flex items-center text-slate-500 hover:text-primary">
            <ChevronLeft className="w-5 h-5" /> Continue Shopping
        </button>
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Your Cart</h2>
        
        {cart.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Your cart is empty.</p>
            </div>
        ) : (
            <>
                <div className="space-y-4 mb-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex gap-4 bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg object-cover" />
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.title}</h3>
                                <p className="text-primary font-bold text-sm mb-2">{formatNaira(item.price)}</p>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded"><Minus className="w-4 h-4" /></button>
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-slate-100 dark:bg-slate-800 rounded"><Plus className="w-4 h-4" /></button>
                                    <div className="flex-1 text-right">
                                        <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between mb-2 opacity-80 text-sm">
                        <span>Subtotal</span>
                        <span>{formatNaira(cartTotal)}</span>
                    </div>
                     <div className="flex justify-between mb-4 opacity-80 text-sm">
                        <span>Delivery (Lagos)</span>
                        <span>{formatNaira(2500)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black mb-6 border-t border-white/20 dark:border-black/10 pt-4">
                        <span>Total</span>
                        <span>{formatNaira(cartTotal + 2500)}</span>
                    </div>
                    <button onClick={() => setView('checkout')} className="w-full bg-primary text-slate-900 font-bold py-3 rounded-xl hover:bg-emerald-400">
                        Proceed to Checkout
                    </button>
                </div>
            </>
        )}
    </div>
  );

  const CheckoutView = () => {
    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        // Validation
        if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
            alert("Please fill in all delivery details.");
            return;
        }
        
        // Success
        alert(`Order Placed Successfully!\n\nThank you ${deliveryInfo.name}. We will contact you at ${deliveryInfo.phone} to confirm delivery to ${deliveryInfo.address}.`);
        if (setCart) setCart([]);
        setDeliveryInfo({ name: '', phone: '', address: '', city: 'Lagos' });
        setView('list');
    };

    return (
      <div className="animate-in slide-in-from-right duration-300 pb-10">
         <button onClick={() => setView('cart')} className="mb-4 flex items-center text-slate-500 hover:text-primary">
            <ChevronLeft className="w-5 h-5" /> Back to Cart
        </button>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Checkout</h2>

        <form onSubmit={handlePlaceOrder}>
            {/* Delivery Details */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Delivery Details
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                        <input 
                            required
                            type="text" 
                            value={deliveryInfo.name}
                            onChange={e => setDeliveryInfo({...deliveryInfo, name: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-primary outline-none"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                        <input 
                            required
                            type="tel" 
                            value={deliveryInfo.phone}
                            onChange={e => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-primary outline-none"
                            placeholder="08012345678"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Delivery Address</label>
                        <textarea 
                            required
                            value={deliveryInfo.address}
                            onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-primary outline-none resize-none h-24"
                            placeholder="Street address, apartment, etc."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">City / State</label>
                        <select 
                            value={deliveryInfo.city}
                            onChange={e => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:border-primary outline-none"
                        >
                            <option value="Lagos">Lagos</option>
                            <option value="Abuja">Abuja</option>
                            <option value="Port Harcourt">Port Harcourt</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" /> Order Summary
                </h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs text-slate-500">
                                    x{item.quantity}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{item.title}</span>
                            </div>
                            <span className="font-medium">{formatNaira(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatNaira(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Delivery</span>
                        <span>{formatNaira(2500)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2">
                        <span>Total</span>
                        <span>{formatNaira(cartTotal + 2500)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-card p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                </h3>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 rounded-full border-4 border-primary bg-white"></div>
                        <span className="font-bold text-sm">Bank Transfer</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-7 mb-3">
                        Make a transfer to the account below. Your order will be processed once payment is confirmed.
                    </p>
                    <div className="pl-7 font-mono text-xs space-y-1 text-slate-600 dark:text-slate-400">
                        <p>Bank: <span className="font-bold text-slate-900 dark:text-white">Flutterwave / Wema</span></p>
                        <p>Acct: <span className="font-bold text-slate-900 dark:text-white tracking-widest">9023456781</span></p>
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-primary text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:bg-emerald-400 flex justify-center items-center gap-2 transition-transform active:scale-95"
            >
                <CheckCircle className="w-5 h-5" /> Place Order ({formatNaira(cartTotal + 2500)})
            </button>
        </form>
      </div>
    );
  };

  if (view === 'product') return <ProductView />;
  if (view === 'cart') return <CartView />;
  if (view === 'checkout') return <CheckoutView />;

  // LIST VIEW
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
           <ShoppingBag className="w-24 h-24 -rotate-12" />
        </div>
        <div className="relative z-10">
           <div className="flex items-center justify-between mb-2">
             <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">ZulaFlow Store</span>
             {cart.length > 0 && (
                 <button onClick={() => setView('cart')} className="bg-white text-emerald-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                     <ShoppingBag className="w-3 h-3" /> Cart ({cart.length})
                 </button>
             )}
           </div>
           <h2 className="text-2xl font-bold mb-1">Gear Up & Fuel Up</h2>
           <p className="text-emerald-100 text-sm max-w-[80%]">
             Premium local & international fitness gear delivered to you.
           </p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
         {['All', 'Nutrition', 'Work-Life', 'Wellness'].map((cat) => (
           <button 
             key={cat} 
             onClick={() => setActiveCategory(cat)}
             className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${activeCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} onClick={() => handleProductClick(item)} className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
            <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-800">
               <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
               {item.tag && (
                 <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                   {item.tag}
                 </span>
               )}
               <div className="absolute bottom-2 right-2 flex gap-1 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-md hover:bg-primary hover:text-white"
                    >
                        <ShoppingBag className="w-4 h-4" />
                    </button>
               </div>
            </div>
            <div className="p-3">
               <div className="flex justify-between items-start mb-1">
                 <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.category}</p>
                 <div className="flex items-center gap-0.5 text-amber-400">
                   <Star className="w-3 h-3 fill-current" />
                   <span className="text-[10px] font-bold text-slate-500">{item.rating}</span>
                 </div>
               </div>
               <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2 leading-tight min-h-[2.5em]">{item.title}</h3>
               <div className="flex justify-between items-center">
                   <p className="font-bold text-primary text-sm">{formatNaira(item.price)}</p>
                   <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Eye className="w-3 h-3" /> {item.views}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 text-center">
         <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
         <h3 className="text-sm font-bold text-slate-900 dark:text-white">Secure Payments</h3>
         <p className="text-xs text-slate-500 mt-1">Bank Transfer • Secured by Flutterwave</p>
      </div>

    </div>
  );
};