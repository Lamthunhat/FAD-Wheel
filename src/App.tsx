/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { WheelItem, WeatherInfo, AIRecommendation, Review, Branch } from './types';
import {
  INITIAL_FOODS_AND_DRINKS,
  HANOI_MERGED_WARDS,
  getGoogleMapsSearchUrl,
  calculateDistanceInKm,
  getItemCoordinates,
  WARD_COORDINATES
} from './data';
import LuckyWheel from './components/LuckyWheel';
import GoogleMapsSearch from './components/GoogleMapsSearch';
import Header from './components/Header';
import Footer from './components/Footer';
import AddPlaceForm from './components/AddPlaceForm';
import ChatbotPanel from './components/ChatbotPanel';
import SavedPlacesPanel from './components/SavedPlacesPanel';
import DetailEditView from './components/DetailEditView';
import WinningModal from './components/WinningModal';

export default function App() {
  // 1. Data States
  const [customItems, setCustomItems] = useState<WheelItem[]>([]);
  const [items, setItems] = useState<WheelItem[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const response = await fetch('/api/places');
        if (response.ok) {
          const data = await response.json() as WheelItem[];
          setItems(data);
          const customs = data.filter(it => it.id.startsWith('custom_') || it.id.startsWith('gmaps_') || it.id.startsWith('sa-'));
          setCustomItems(customs);
        } else {
          setItems(INITIAL_FOODS_AND_DRINKS);
          setCustomItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch places from backend:", err);
        setItems(INITIAL_FOODS_AND_DRINKS);
        setCustomItems([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    loadPlaces();
  }, []);

  // Dynamically derive present categories in our database so users can filter by them
  const foodCategories = useMemo(() => {
    const list = items
      .filter(it => it.type === 'food' && it.category)
      .map(it => it.category!);
    const defaultPresets = ['Phở', 'Bún', 'Cơm', 'Món cuốn', 'Đồ Hàn', 'Đồ Nhật', 'Đồ ăn vặt', 'Lẩu', 'Bánh mì'];
    return Array.from(new Set([...defaultPresets, ...list])).filter(Boolean);
  }, [items]);

  const drinkCategories = useMemo(() => {
    const list = items
      .filter(it => it.type === 'drink' && it.category)
      .map(it => it.category!);
    const defaultPresets = ['Cà phê', 'Trà', 'Trà sữa', 'Sinh tố / Đá xay'];
    return Array.from(new Set([...defaultPresets, ...list])).filter(Boolean);
  }, [items]);

  const [weather, setWeather] = useState<WeatherInfo>({
    city: 'Hà Nội',
    temp: 26,
    condition: 'sunny',
    humidity: 62,
    windSpeed: 12,
    description: 'Trời thu nắng nhẹ dạo phố cổ Hà Nội cực kỳ thích thú.'
  });

  const [isWeatherLive, setIsWeatherLive] = useState<boolean>(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // 2. Filter States
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'drink'>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  // Reset subcategory when broad category changes
  useEffect(() => {
    setSelectedSubCategory('all');
  }, [selectedCategory]);

  const availableSubCategories = useMemo(() => {
    const relevantItems = items.filter(it => {
      if (selectedCategory === 'all') return true;
      return it.type === selectedCategory;
    });
    const cats = relevantItems
      .map(it => it.category)
      .filter((cat): cat is string => !!cat);
    return Array.from(new Set(cats)).sort((a: string, b: string) => a.localeCompare(b, 'vi'));
  }, [items, selectedCategory]);

  const [selectedWards, setSelectedWards] = useState<string[]>(() => {
    // Select all wards by default
    return HANOI_MERGED_WARDS;
  });
  const [onlyShowAIRecommended, setOnlyShowAIRecommended] = useState<boolean>(false);

  // 2b. Location and Saved Places Filter States
  const [savedListActiveType, setSavedListActiveType] = useState<'food' | 'drink'>('food');
  const [savedListWards, setSavedListWards] = useState<string[]>(() => HANOI_MERGED_WARDS);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [savedListSubCat, setSavedListSubCat] = useState<string>('all');

  // 3. AI recommendation results
  const [aiResult, setAiResult] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Chatbot States
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    recommendedItemIds?: string[];
  }[]>(() => {
    return [
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Xin chào! Mình là Tú béo đây. 🍜 Hôm nay bạn muốn tìm quán ăn, đồ uống gì trong hòm quán tủ của mình nhỉ? Hãy nhắn tin hỏi mình nhé (ví dụ: "trời lạnh ăn phở tủ nào ngon" hay "Hôm nay trời nóng bức quá dắt người thương đi uống cafe đá ở đâu hợp?")',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // 4. Spin States
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningItem, setWinningItem] = useState<WheelItem | null>(null);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [spinHistory, setSpinHistory] = useState<{ item: WheelItem; timestamp: string }[]>(() => {
    const saved = localStorage.getItem('hanoi_spin_history');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. Add custom item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'food' | 'drink'>('food');
  const [newItemWard, setNewItemWard] = useState(HANOI_MERGED_WARDS[0]);
  const [newItemAddress, setNewItemAddress] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemWeather, setNewItemWeather] = useState<string[]>(['cool']);
  const [newItemCategory, setNewItemCategory] = useState('Phở');
  const [customNewItemCategory, setCustomNewItemCategory] = useState('');

  // 6. Detail with editing page view state
  const [selectedDetailItem, setSelectedDetailItem] = useState<WheelItem | null>(null);

  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'food' | 'drink'>('food');
  const [editWard, setEditWard] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPrice, setEditPrice] = useState('20.000đ - 50.000đ');
  const [editBestWeather, setEditBestWeather] = useState<string[]>(['cool']);
  const [editCategory, setEditCategory] = useState('');
  const [customEditCategory, setCustomEditCategory] = useState('');

  // Reviews specific states
  const [editReviews, setEditReviews] = useState<Review[]>([]);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewPrice, setReviewPrice] = useState<'rẻ' | 'vừa' | 'đắt'>('vừa');
  const [reviewQuantity, setReviewQuantity] = useState<'ít' | 'no' | 'nhiều'>('no');
  const [reviewHygiene, setReviewHygiene] = useState<'sạch sẽ' | 'bẩn'>('sạch sẽ');
  const [reviewSpace, setReviewSpace] = useState<'rộng rãi - thoáng mát' | 'chật chội - nóng nực'>('rộng rãi - thoáng mát');
  const [reviewParking, setReviewParking] = useState<'có' | 'không'>('có');

  // Branches specific states
  const [editBranches, setEditBranches] = useState<Branch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  useEffect(() => {
    if (selectedDetailItem) {
      setEditName(selectedDetailItem.name);
      setEditType(selectedDetailItem.type);
      setEditWard(selectedDetailItem.location.ward);
      setEditAddress(selectedDetailItem.location.addressDetail || '');
      setEditPrice(selectedDetailItem.priceRange);
      setEditBestWeather(selectedDetailItem.bestWeather || ['cool']);
      setEditReviews(selectedDetailItem.reviews || []);
      setEditBranches(selectedDetailItem.branches || []);

      const itemCat = selectedDetailItem.category || '';
      const listToCheck = selectedDetailItem.type === 'food' ? foodCategories : drinkCategories;
      if (itemCat && !listToCheck.includes(itemCat)) {
        setEditCategory('custom_other');
        setCustomEditCategory(itemCat);
      } else {
        setEditCategory(itemCat);
        setCustomEditCategory('');
      }
    }
  }, [selectedDetailItem]);

  // Sync spin history to localStorage
  useEffect(() => {
    localStorage.setItem('hanoi_spin_history', JSON.stringify(spinHistory));
  }, [spinHistory]);

  // Dynamic derivation of matching saved list items based on advanced filters
  const filteredSavedItems = useMemo(() => {
    return customItems.filter(item => {
      // 1. Broad Type Filter (food or drink)
      if (item.type !== savedListActiveType) {
        return false;
      }

      // 2. Subcategory Filter ("Danh mục món/nước")
      if (savedListSubCat !== 'all' && item.category !== savedListSubCat) {
        return false;
      }

      // 3. Ward Filter (Matching main location OR any of its branches)
      const mainWardMatches = savedListWards.includes(item.location.ward);

      let branchWardMatches = false;
      if (item.branches && item.branches.length > 0) {
        for (const br of item.branches) {
          const addrLower = br.address.toLowerCase();
          for (const ward of savedListWards) {
            if (addrLower.includes(ward.toLowerCase())) {
              branchWardMatches = true;
              break;
            }
            const wardShort = ward.replace(/^Phường\s+/i, '').trim().toLowerCase();
            if (wardShort && addrLower.includes(wardShort)) {
              branchWardMatches = true;
              break;
            }
          }
          if (branchWardMatches) break;
        }
      }

      if (!mainWardMatches && !branchWardMatches) {
        return false;
      }

      return true;
    });
  }, [customItems, savedListActiveType, savedListSubCat, savedListWards]);

  // Sorting saved items by nearest distance if enabled, otherwise alphabetically
  const processedSavedItems = useMemo(() => {
    const list = [...filteredSavedItems];

    if (sortByDistance && userCoords) {
      // Helper to compute min distance to user position (primary or branch coords)
      const listWithDistance = list.map(item => {
        const primaryCoords = getItemCoordinates(item);
        let minDistance = calculateDistanceInKm(userCoords.lat, userCoords.lng, primaryCoords.lat, primaryCoords.lng);

        if (item.branches && item.branches.length > 0) {
          for (const br of item.branches) {
            // Check address to map to a ward's geographical center
            let matchedCoords: { lat: number; lng: number } | null = null;
            for (const ward of HANOI_MERGED_WARDS) {
              if (br.address.toLowerCase().includes(ward.toLowerCase())) {
                matchedCoords = WARD_COORDINATES[ward];
                break;
              }
              const wardShort = ward.replace(/^Phường\s+/i, '').trim().toLowerCase();
              if (wardShort && br.address.toLowerCase().includes(wardShort)) {
                matchedCoords = WARD_COORDINATES[ward];
                break;
              }
            }
            if (matchedCoords) {
              const brDist = calculateDistanceInKm(userCoords.lat, userCoords.lng, matchedCoords.lat, matchedCoords.lng);
              if (brDist < minDistance) {
                minDistance = brDist;
              }
            }
          }
        }
        return { item, distance: minDistance };
      });

      // Sort by distance ascending
      return listWithDistance
        .sort((a, b) => a.distance - b.distance)
        .map(obj => ({
          ...obj.item,
          calculatedDistance: obj.distance
        }));
    } else {
      // Sort alphabetically
      return list.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));
    }
  }, [filteredSavedItems, sortByDistance, userCoords]);

  // Load real-time live weather on mount
  useEffect(() => {
    fetchLiveWeather();
  }, []);

  const fetchLiveWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch('/api/weather/hanoi-live');
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        setIsWeatherLive(true);
      }
    } catch (e) {
      console.error('Error fetching live weather', e);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // Trigger Gemini AI advisor recommendation with local caching to prevent rate-limiting (429)
  const handleTriggerAI = async () => {
    if (!weather) return;

    // Build a unique cache key based on weather condition, temperature, and current items count
    const cacheKey = `hanoi_ai_rec_${weather.condition}_${Math.round(weather.temp || 26)}_${items.length}`;
    const cachedRecommend = localStorage.getItem(cacheKey);

    if (cachedRecommend) {
      try {
        const parsed = JSON.parse(cachedRecommend);
        if (parsed && parsed.suggestedItems && parsed.weatherAnalysis) {
          setAiResult(parsed);
          return;
        }
      } catch (err) {
        localStorage.removeItem(cacheKey);
      }
    }

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/weather/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weather: weather,
          items: items
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiResult(data);

        // Cache the valid response
        if (data && data.suggestedItems) {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error('Error getting AI recommendation', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Interactive Chatbot submission
  const handleSendChatMessage = async () => {
    const userMsgText = chatInput.trim();
    if (!userMsgText) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user' as const,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    const historyPayload = updatedMessages.slice(-8).map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    try {
      const response = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsgText,
          history: historyPayload,
          items: items
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: `msg_${Date.now()}_bot`,
          sender: 'bot' as const,
          text: data.reply || "Gợi ý của mình đã sẵn sàng cho bạn thưởng thức rồi đấy!",
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          recommendedItemIds: data.recommendedItemIds
        };
        setChatMessages(prev => [...prev, botMessage]);

        if (data.recommendedItemIds && data.recommendedItemIds.length > 0) {
          setAiResult({
            suggestedItems: data.recommendedItemIds,
            weatherAnalysis: data.reply,
            vibeText: "Hà Nội ngõ nhỏ, phố nhỏ, quán nhỏ lấp lánh niềm vui ngọt ngào."
          });
        }
      } else {
        throw new Error("Server error responding to advisor chat");
      }
    } catch (error) {
      console.warn("Chatbot fetch error:", error);
      const botErrorMessage = {
        id: `msg_${Date.now()}_err`,
        sender: 'bot' as const,
        text: "Ôi hổ thẹn quá, đầu máy AI của mình bận rộn mất rồi! Mình đã chuyển kết nối ngoại tuyến. Thử hỏi các câu liên quan đến **nóng/lạnh/phở/bún chả** để mình tra cứu nhanh danh mục offline cho bạn liền nha!",
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, botErrorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Run AI upon first weather update if Gemini API is available
  useEffect(() => {
    if (weather) {
      handleTriggerAI();
    }
  }, [weather.condition, weather.temp]);

  // Filter items for the spinner wheel - Updated with branch ward matching
  const filteredItems = items.filter(item => {
    // 1. Category Filter
    if (selectedCategory !== 'all' && item.type !== selectedCategory) {
      return false;
    }
    // 1b. Sub Category Filter (Danh mục cụ thể)
    if (selectedSubCategory !== 'all' && item.category !== selectedSubCategory) {
      return false;
    }
    // 2. Ward Filter (Matching main location OR any of its branches)
    const mainWardMatches = selectedWards.includes(item.location.ward);
    let branchWardMatches = false;
    if (item.branches && item.branches.length > 0) {
      for (const br of item.branches) {
        const addrLower = br.address.toLowerCase();
        for (const ward of selectedWards) {
          if (addrLower.includes(ward.toLowerCase())) {
            branchWardMatches = true;
            break;
          }
          const wardShort = ward.replace(/^Phường\s+/i, '').trim().toLowerCase();
          if (wardShort && addrLower.includes(wardShort)) {
            branchWardMatches = true;
            break;
          }
        }
        if (branchWardMatches) break;
      }
    }

    if (!mainWardMatches && !branchWardMatches) {
      return false;
    }
    return true;
  });

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let finalCategory = newItemCategory === 'custom_other'
      ? (customNewItemCategory.trim() || 'Khác')
      : newItemCategory;

    if (newItemCategory === 'custom_other') {
      finalCategory = finalCategory
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const added: WheelItem = {
      id: 'custom_' + Date.now(),
      name: newItemName.trim(),
      type: newItemType,
      category: finalCategory,
      location: {
        ward: newItemWard,
        addressDetail: newItemAddress.trim() || undefined
      },
      priceRange: newItemPrice,
      bestWeather: newItemWeather,
      reviews: []
    };

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(added)
      });
      if (response.ok) {
        const saved = await response.json();
        setCustomItems(prev => [saved, ...prev]);
        setItems(prev => [saved, ...prev]);
      } else {
        setCustomItems(prev => [added, ...prev]);
        setItems(prev => [added, ...prev]);
      }
    } catch (err) {
      console.error("Error creating place on server:", err);
      setCustomItems(prev => [added, ...prev]);
      setItems(prev => [added, ...prev]);
    }

    if (!selectedWards.includes(newItemWard)) {
      setSelectedWards(prev => [...prev, newItemWard]);
    }

    // Reset fields
    setNewItemName('');
    setNewItemAddress('');
    setCustomNewItemCategory('');

    // Add success toast
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#06D6A0] text-[#2D3047] border-4 border-[#2D3047] px-4 py-2 rounded-xl font-bold font-mono text-sm shadow-[4px_4px_0px_#2D3047] z-50 animate-float';
    toast.innerText = `Đã thêm món "${added.name}" thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa địa điểm này khỏi thực đơn không?')) {
      try {
        const response = await fetch(`/api/places/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setItems(prev => prev.filter(item => item.id !== id));
          setCustomItems(prev => prev.filter(item => item.id !== id));
        } else {
          setItems(prev => prev.filter(item => item.id !== id));
          setCustomItems(prev => prev.filter(item => item.id !== id));
        }
      } catch (err) {
        console.error("Error deleting place from server:", err);
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleSaveEditedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDetailItem) return;
    if (!editName.trim()) return;

    let finalCat = editCategory === 'custom_other'
      ? (customEditCategory.trim() || 'Khác')
      : editCategory;

    if (editCategory === 'custom_other') {
      finalCat = finalCat
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    const updatedItem: WheelItem = {
      ...selectedDetailItem,
      name: editName.trim(),
      type: editType,
      category: finalCat,
      location: {
        ward: editWard,
        addressDetail: editAddress.trim() || undefined
      },
      priceRange: editPrice.trim(),
      bestWeather: editBestWeather,
      reviews: editReviews,
      branches: editBranches
    };

    try {
      const response = await fetch(`/api/places/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (response.ok) {
        const saved = await response.json();
        setItems(prev => prev.map(item => item.id === saved.id ? saved : item));
        setCustomItems(prev => prev.map(item => item.id === saved.id ? saved : item));
      } else {
        setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setCustomItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      }
    } catch (err) {
      console.error("Error updating place on server:", err);
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      setCustomItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-[#06D6A0] text-[#2D3047] border-4 border-[#2D3047] px-4 py-2 rounded-xl font-bold font-mono text-sm shadow-[4px_4px_0px_#2D3047] z-50 animate-float';
    toast.innerText = `Đã cập nhật món "${updatedItem.name}" thành công!`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);

    setCustomEditCategory('');
    setSelectedDetailItem(null);
  };

  const handleImportItem = async (imported: WheelItem) => {
    const itemToImport = {
      ...imported,
      reviews: imported.reviews || [],
      branches: imported.branches || []
    };

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToImport)
      });
      if (response.ok) {
        const saved = await response.json();
        setItems(prev => {
          if (prev.some(it => it.id === saved.id)) return prev;
          return [saved, ...prev];
        });
        setCustomItems(prev => {
          if (prev.some(it => it.id === saved.id)) return prev;
          return [saved, ...prev];
        });
      } else {
        setItems(prev => {
          if (prev.some(it => it.id === itemToImport.id)) return prev;
          return [itemToImport, ...prev];
        });
        setCustomItems(prev => {
          if (prev.some(it => it.id === itemToImport.id)) return prev;
          return [itemToImport, ...prev];
        });
      }
    } catch (err) {
      console.error("Error importing place to server:", err);
      setItems(prev => {
        if (prev.some(it => it.id === itemToImport.id)) return prev;
        return [itemToImport, ...prev];
      });
      setCustomItems(prev => {
        if (prev.some(it => it.id === itemToImport.id)) return prev;
        return [itemToImport, ...prev];
      });
    }

    if (!selectedWards.includes(imported.location.ward)) {
      setSelectedWards(prev => [...prev, imported.location.ward]);
    }
  };

  const handleRemoveImportedItem = async (id: string) => {
    try {
      const response = await fetch(`/api/places/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      } else {
        setItems(prev => prev.filter(item => item.id !== id));
        setCustomItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Error removing imported place from server:", err);
      setItems(prev => prev.filter(item => item.id !== id));
      setCustomItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSpinEnd = (item: WheelItem) => {
    setWinningItem(item);
    setShowWinModal(true);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setSpinHistory(prev => [{ item, timestamp: formattedTime }, ...prev.slice(0, 19)]);
  };

  // Toggling selected wards list (allows toggling down to empty array)
  const toggleWard = (ward: string) => {
    setSelectedWards(prev => {
      if (prev.includes(ward)) {
        return prev.filter(w => w !== ward);
      } else {
        return [...prev, ward];
      }
    });
  };

  const handleSetMockLocation = () => {
    setUserCoords({ lat: 21.0285, lng: 105.8521 });
    setSortByDistance(true);

    const toast = document.createElement('div');
    toast.className = "fixed bottom-5 right-5 bg-[#118AB2] text-white font-black text-xs px-4 py-3 rounded-xl border-2 border-stone-800 shadow-[3px_3px_0px_#2D3047] z-50 transition-all";
    toast.innerText = "📍 Đã đặt mốc vị trí tại Hồ Hoàn Kiếm, Hà Nội!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        setSortByDistance(true);

        const toast = document.createElement('div');
        toast.className = "fixed bottom-5 right-5 bg-[#06D6A0] text-white font-black text-xs px-4 py-3 rounded-xl border-2 border-stone-850 shadow-[3px_3px_0px_#2D3047] z-50 transition-all";
        toast.innerText = "✨ Định vị thành công vị trí của bạn!";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        setIsLocating(false);

        let errorMsg = "Không thể lấy vị trí GPS.";
        if (error.code === 1) {
          errorMsg = "Quyền truy cập vị trí bị từ chối! Vui lòng cho phép định vị trong cài đặt Safari/iOS (Cài đặt -> Quyền riêng tư -> Dịch vụ định vị -> Safari) hoặc bật định vị của điện thoại.";
        } else if (error.code === 2) {
          errorMsg = "Không tìm thấy dữ liệu GPS (Vị trí không khả dụng). Hãy thử lại ở nơi thoáng mát hoặc bật mạng.";
        } else if (error.code === 3) {
          errorMsg = "Yêu cầu định vị bị hết thời gian (Timeout).";
        }

        alert(`❌ Định vị thất bại:\n${errorMsg}\n\nHệ thống sẽ tự động đặt mốc mặc định tại Hồ Hoàn Kiếm, Hà Nội.`);

        setUserCoords({ lat: 21.0285, lng: 105.8521 });
        setSortByDistance(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };

  return (
    <div id="hanoi-foodie-root" className="min-h-screen bg-[#FFF9F2] vintage-grid flex flex-col font-sans select-none relative pb-12">

      <Header
        weather={weather}
        isWeatherLoading={isWeatherLoading}
        fetchLiveWeather={fetchLiveWeather}
      />

      {/* Main Grid container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {selectedDetailItem ? (
          <DetailEditView
            selectedDetailItem={selectedDetailItem}
            setSelectedDetailItem={setSelectedDetailItem}
            editName={editName}
            setEditName={setEditName}
            editType={editType}
            setEditType={setEditType}
            editWard={editWard}
            setEditWard={setEditWard}
            editAddress={editAddress}
            setEditAddress={setEditAddress}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editBestWeather={editBestWeather}
            setEditBestWeather={setEditBestWeather}
            editCategory={editCategory}
            setEditCategory={setEditCategory}
            customEditCategory={customEditCategory}
            setCustomEditCategory={setCustomEditCategory}
            editReviews={editReviews}
            setEditReviews={setEditReviews}
            editBranches={editBranches}
            setEditBranches={setEditBranches}
            foodCategories={foodCategories}
            drinkCategories={drinkCategories}
            HANOI_MERGED_WARDS={HANOI_MERGED_WARDS}
            handleSaveEditedItem={handleSaveEditedItem}
            newBranchName={newBranchName}
            setNewBranchName={setNewBranchName}
            newBranchAddress={newBranchAddress}
            setNewBranchAddress={setNewBranchAddress}
            newReviewComment={newReviewComment}
            setNewReviewComment={setNewReviewComment}
            newReviewRating={newReviewRating}
            setNewReviewRating={setNewReviewRating}
            reviewPrice={reviewPrice}
            setReviewPrice={setReviewPrice}
            reviewQuantity={reviewQuantity}
            setReviewQuantity={setReviewQuantity}
            reviewHygiene={reviewHygiene}
            setReviewHygiene={setReviewHygiene}
            reviewSpace={reviewSpace}
            setReviewSpace={setReviewSpace}
            reviewParking={reviewParking}
            setReviewParking={setReviewParking}
          />
        ) : (
          <>
            {/* Left Side: Filter, Custom Form */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Section: Category Food/Drink Selector */}
              <div className="bg-white border-4 border-[#2D3047] rounded-3xl p-5 shadow-[6px_6px_0px_#2D3047]">
                <h2 className="text-lg font-black text-[#2D3047] mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-[#00B4D8] rounded-full"></span> Danh Mục Vòng Quay
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="btn-cat-all"
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-[#FFD166] text-[#2D3047]'
                        : 'bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    🍜 TẤT CẢ
                  </button>
                  <button
                    id="btn-cat-food"
                    type="button"
                    onClick={() => setSelectedCategory('food')}
                    className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                      selectedCategory === 'food'
                        ? 'bg-[#EF476F] text-white'
                        : 'bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    🍱 QUÁN ĂN
                  </button>
                  <button
                    id="btn-cat-drink"
                    type="button"
                    onClick={() => setSelectedCategory('drink')}
                    className={`p-2.5 rounded-xl font-bold text-xs uppercase shadow-[3px_3px_0px_#2D3047] border-2 border-[#2D3047] transition-all cursor-pointer ${
                      selectedCategory === 'drink'
                        ? 'bg-[#118AB2] text-white'
                        : 'bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    🥤 QUÁN NƯỚC
                  </button>
                </div>

                {/* Sub-Category Filter Toolbar */}
                {availableSubCategories.length > 0 && (
                  <div className="mt-4 pt-3 border-t-2 border-stone-100">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">
                      Danh Mục Đặc Trưng:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      <button
                        id="btn-subcat-all"
                        type="button"
                        onClick={() => setSelectedSubCategory('all')}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                          selectedSubCategory === 'all'
                            ? 'bg-[#2D3047] text-white border-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        🏷️ Tất cả món
                      </button>
                      {availableSubCategories.map(cat => (
                        <button
                          id={`btn-subcat-${cat}`}
                          key={cat}
                          type="button"
                          onClick={() => setSelectedSubCategory(cat)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                            selectedSubCategory === cat
                              ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-[1px_1px_0px_#2D3047]'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Live Google Maps Search (SerpApi) */}
              <GoogleMapsSearch
                activeItems={items}
                onAddItem={handleImportItem}
                onRemoveItem={handleRemoveImportedItem}
                userCoords={userCoords}
                isLocating={isLocating}
                onLocateUser={handleLocateUser}
                onSetMockLocation={handleSetMockLocation}
              />

              {/* Section: Add Custom Place */}
              <AddPlaceForm
                newItemName={newItemName}
                setNewItemName={setNewItemName}
                newItemType={newItemType}
                setNewItemType={setNewItemType}
                newItemCategory={newItemCategory}
                setNewItemCategory={setNewItemCategory}
                customNewItemCategory={customNewItemCategory}
                setCustomNewItemCategory={setCustomNewItemCategory}
                newItemWard={newItemWard}
                setNewItemWard={setNewItemWard}
                newItemAddress={newItemAddress}
                setNewItemAddress={setNewItemAddress}
                newItemPrice={newItemPrice}
                setNewItemPrice={setNewItemPrice}
                newItemWeather={newItemWeather}
                setNewItemWeather={setNewItemWeather}
                foodCategories={foodCategories}
                drinkCategories={drinkCategories}
                HANOI_MERGED_WARDS={HANOI_MERGED_WARDS}
                handleAddNewItem={handleAddNewItem}
              />
            </div>

            {/* Center Side: LUCKY WHEEL SPINNER */}
            <div id="lucky-wheel-center-pane" className="lg:col-span-5 flex flex-col items-center justify-start p-4 gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#2D3047] uppercase tracking-tight mt-1 mb-2">
                  Vòng quay định mệnh
                </h2>
                <p className="text-xs text-stone-500 font-mono">
                  Có tất cả <span className="text-[#FF6B35] font-black text-sm">{filteredItems.length}</span> lựa chọn đã lọc
                </p>
              </div>

              {/* Wheel Container */}
              <div className="flex flex-col items-center justify-start lg:w-[420px] shrink-0 w-full">
                <div className="bg-white/40 p-4 pb-8 rounded-3xl border-2 border-stone-200/50 backdrop-blur-xs flex justify-center w-full max-w-[420px] shadow-3xs">
                  {filteredItems.length > 0 ? (
                    <LuckyWheel
                      items={filteredItems}
                      onSpinEnd={handleSpinEnd}
                      isSpinning={isSpinning}
                      setIsSpinning={setIsSpinning}
                    />
                  ) : (
                    <div className="w-full py-20 text-center border-4 border-dashed border-stone-300 rounded-3xl bg-white px-6">
                      <HelpCircle className="w-12 h-12 text-stone-300 mx-auto mb-4 animate-bounce" />
                      <p className="text-sm font-black text-[#2D3047] uppercase">Không có món nào!</p>
                      <p className="text-xs text-stone-500 mt-2">
                        Bộ lọc quá ngặt nghèo dấm tỏi, vui lòng chọn thêm phường hoặc bớt điều kiện đề cử AI để vòng quay có món ăn.
                      </p>
                      <button
                        id="btn-reset-filters-inline"
                        type="button"
                        onClick={() => {
                          setSelectedWards(HANOI_MERGED_WARDS);
                          setOnlyShowAIRecommended(false);
                          setSelectedCategory('all');
                        }}
                        className="mt-4 text-xs font-bold bg-[#FFD166] border-2 border-[#2D3047] px-4 py-2 rounded-xl text-[#2D3047] shadow-[2.5px_2.5px_0px_#2D3047] cursor-pointer"
                      >
                        Thiết lập lại bộ lọc ngay
                      </button>
                    </div>
                  )}
                </div>

                {/* Dynamic location filters (wards checklists) */}
                <div className="mt-4 w-full bg-white border-4 border-[#2D3047] rounded-3xl p-4 shadow-[4px_4px_0px_#2D3047]">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-stone-100">
                    <h4 className="text-[11px] font-black text-[#2D3047] uppercase tracking-wider flex items-center gap-1">
                      📍 BỘ LỌC ĐỊA ĐIỂM VÒNG QUAY ({selectedWards.length})
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWards(HANOI_MERGED_WARDS)}
                        className="text-[10px] font-black text-[#FF6B35] hover:underline bg-transparent border-none cursor-pointer text-xs"
                      >
                        Chọn tất
                      </button>
                      <span className="text-stone-300 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedWards([])}
                        className="text-[10px] font-black text-stone-400 hover:underline bg-transparent border-none cursor-pointer text-xs"
                      >
                        Dọn lọc
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-stone-400 mb-2 font-bold leading-normal">
                    Chỉ chọn những quán có vị trí thuộc các phường được tích dưới đây đưa vào vòng quay:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {HANOI_MERGED_WARDS.map(ward => {
                      const isChecked = selectedWards.includes(ward);
                      return (
                        <button
                          id={`btn-wheel-ward-${ward.replace(/\s+/g, '')}`}
                          key={`wheel-ward-${ward}`}
                          type="button"
                          onClick={() => toggleWard(ward)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left transition-all text-[10px] font-extrabold cursor-pointer truncate ${
                            isChecked
                              ? 'bg-[#FFFBF5] border-[#2D3047] text-[#2D3047] shadow-[1px_1px_0px_#2D3047]'
                              : 'bg-stone-50 border-stone-200/40 text-stone-400 hover:bg-white hover:border-stone-300'
                          }`}
                        >
                          <span className="shrink-0 flex items-center justify-center">
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-[#EF476F]" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-stone-300" />
                            )}
                          </span>
                          <span className="truncate">{ward.replace(/^Phường\s+/i, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 text-center max-w-[380px] bg-[#FAF8F5] px-4 py-3 rounded-2xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed font-sans relative">
                  <Info className="w-4 h-4 text-[#FF6B35] absolute -top-2 left-1/2 -translate-x-1/2 bg-white rounded-full p-0.5 border border-stone-200 shrink-0" />
                  Vòng quay tự chia phân độ dựa trên số quán đã được lọc. Có thể click vào <span className="font-bold underline text-[#FF6B35]">QUAY NGAY!</span> hoặc nhấn trực tiếp chiếc mũi tên kim chỉ nam để bắt đầu trò chơi hoang dại.
                </div>
              </div>

              {/* Saved Custom Places Side Panel */}
              <SavedPlacesPanel
                customItems={customItems}
                processedSavedItems={processedSavedItems}
                savedListActiveType={savedListActiveType}
                setSavedListActiveType={setSavedListActiveType}
                savedListWards={savedListWards}
                setSavedListWards={setSavedListWards}
                sortByDistance={sortByDistance}
                setSortByDistance={setSortByDistance}
                savedListSubCat={savedListSubCat}
                setSavedListSubCat={setSavedListSubCat}
                foodCategories={foodCategories}
                drinkCategories={drinkCategories}
                userCoords={userCoords}
                isLocating={isLocating}
                handleLocateUser={handleLocateUser}
                setSelectedDetailItem={setSelectedDetailItem}
                handleDeleteItem={handleDeleteItem}
                HANOI_MERGED_WARDS={HANOI_MERGED_WARDS}
              />
            </div>

            {/* Right Side: AI WEATHER ADVISOR & HISTORY */}
            <div className="lg:col-span-3 w-full flex flex-col gap-6">
              <ChatbotPanel
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                isChatLoading={isChatLoading}
                handleSendChatMessage={handleSendChatMessage}
                setChatMessages={setChatMessages}
                setAiResult={setAiResult}
                weather={weather}
                items={items}
                setSelectedDetailItem={setSelectedDetailItem}
                chatContainerRef={chatContainerRef}
                aiResult={aiResult}
              />
            </div>
          </>
        )}
      </main>

      <WinningModal
        showWinModal={showWinModal}
        setShowWinModal={setShowWinModal}
        winningItem={winningItem}
        setIsSpinning={setIsSpinning}
      />

      <Footer />
    </div>
  );
}
