import React, { useState } from 'react';
import { Search, Grid3x3, List, LayoutGrid, ChevronDown, Minus, Plus, Bell, Headphones,ArrowLeft } from 'lucide-react';

const menuItems = [
  { id: 1, name: 'Idli with Sambar', price: 60.00, available: true, img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=200&h=150&fit=crop' },
  { id: 2, name: 'Masala Dosa with Coconut Chutney', price: 80.00, available: true, img: 'https://images.unsplash.com/photo-1694809770008-9f31aa7827ab?w=200&h=150&fit=crop' },
  { id: 3, name: 'Upma', price: 50.00, available: true, img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=200&h=150&fit=crop' },
  { id: 4, name: 'Omelette with Toast', price: 90.00, available: false, img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=150&fit=crop' },
  { id: 5, name: 'Aloo Paratha with Yogurt', price: 70.00, available: true, img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&h=150&fit=crop' },
  { id: 6, name: 'Chicken Biryani', price: 150.00, available: false, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=150&fit=crop' },
  { id: 7, name: 'Poha', price: 40.00, available: true, img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&h=150&fit=crop' },
  { id: 8, name: 'Vegetable Biryani', price: 130.00, available: true, img: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=200&h=150&fit=crop' },
  { id: 9, name: 'Mutton Curry with Rice', price: 180.00, available: false, img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=150&fit=crop' },
  { id: 10, name: 'Chapati with Dal Fry', price: 80.00, available: true, img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=150&fit=crop' },
  { id: 11, name: 'Andhra Thali (Vegetarian)', price: 120.00, available: true, img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&h=150&fit=crop' },
  { id: 12, name: 'Puri with Potato Curry', price: 80.00, available: true, img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=150&fit=crop' },
  { id: 13, name: 'Paneer Tikka', price: 100.00, available: true, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=200&h=150&fit=crop' },
  { id: 14, name: 'Samosa with Chutney', price: 120.00, available: true, img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=150&fit=crop' },
  { id: 15, name: 'Lunch Combo (Vegetable Biryani + Raita)', price: 150.00, available: true, img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=150&fit=crop' },
];

const categories = [
  { name: 'Appetizers', icon: '🥟' },
  { name: 'Main Courses', icon: '🍛' },
  { name: 'Thalis', icon: '🍽️' },
  { name: 'Rice Dishes', icon: '🍚' },
  { name: 'Beverages', icon: '🥤' },
  { name: 'Curries', icon: '🍜' },
  { name: 'Combos', icon: '🍱' },
  { name: 'Desserts', icon: '🍰' },
];

const BistroBillPOS = () => {
  const [activeTab, setActiveTab] = useState('Dine In');
  const [activeCategory, setActiveCategory] = useState('Recommended');
  const [guestCount, setGuestCount] = useState(0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Bistro Bill</h1>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-800">
              <Headphones className="w-5 h-5" />
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Andhara Meals</span>
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <div className="w-6 h-6 bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-500 rounded"></div>
            <span className="font-medium">Point of Sale</span>
          </button>
          <button className="text-blue-600 font-medium">Take A Order</button>
          <button className="text-gray-600 hover:text-gray-800">My Orders</button>
          <button className="text-gray-600 hover:text-gray-800">Table View</button>
          <button className="text-gray-600 hover:text-gray-800">Reservations</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Order Type Tabs */}
          <div className="flex items-center gap-2 mb-6 bg-white border-2 border-blue-600 rounded-full p-1 inline-flex">
            {['Dine In', 'Takeaway', 'Subscription', 'Catering'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search and View Controls */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Name, SKU, or Barcode, Tag, Brand"
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 bg-white border border-gray-300 rounded-lg p-1">
              <button className="p-2 bg-blue-600 text-white rounded">
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                <List className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories and Menu */}
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-48 flex-shrink-0">
              {/* Meal Time Filter */}
              <div className="bg-blue-600 rounded-2xl p-1 mb-4">
                {['Recommended', 'Breakfast', 'Lunch', 'Dinner'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setActiveCategory(time)}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === time
                        ? 'bg-white text-blue-600'
                        : 'text-white hover:bg-blue-500'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              {/* Food Categories */}
              <div className="space-y-1">
                {categories.map((category, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all text-left text-sm"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative mb-3">
                      <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${
                        item.available ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div className="w-full h-32 bg-gray-100 rounded-xl overflow-hidden">
                        <img 
                          src={item.img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">Price: ₹ {item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-1">Table Details</h2>
            <p className="text-sm text-gray-500">Enter table details to proceed</p>
          </div>

          <div className="space-y-4 flex-1">
            {/* Table Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select Table</option>
                  <option>Table 1</option>
                  <option>Table 2</option>
                  <option>Table 3</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Server Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Server</label>
              <div className="relative">
                <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-400 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select Server</option>
                  <option>Server 1</option>
                  <option>Server 2</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Count</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={guestCount || 'Guest Count'}
                  readOnly
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-center text-gray-400 focus:outline-none"
                />
                <button
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors mt-6">
            Next: Add Items
          </button>
        </div>
      </div>
    </div>
  );
};

export default BistroBillPOS;