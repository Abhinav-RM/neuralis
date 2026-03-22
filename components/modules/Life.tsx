import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, TrendingUp, Zap, Activity, Layers, ShoppingBag, Snowflake, ArrowUpCircle, Package, Target, CheckCircle2, Circle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDateKey } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { sound } from '../../utils/sound';
import clsx from 'clsx';

export const Life: React.FC = () => {
    const { state, updateFootball, updateGym, completeBounty, deductCoins } = useApp();
    const { football, gym, college, dailyBounties } = state;
    const [activeTab, setActiveTab] = useState<'overview' | 'market'>('overview');

    // Aggregate stats
    const totalXP = (state.enabledModules.football ? football.xp : 0) + (state.enabledModules.gym ? gym.xp : 0);
    const activeModulesCount = [state.enabledModules.football, state.enabledModules.gym].filter(Boolean).length;
    const averageLevel = activeModulesCount > 0 
        ? Math.floor(((state.enabledModules.football ? football.level : 0) + (state.enabledModules.gym ? gym.level : 0)) / activeModulesCount)
        : 0;
    const totalCoins = state.coins; // Shared currency

    // Store Items (Added Gym Specific Items)
    const SHOP_ITEMS = [
        { id: 'freeze', name: 'Field Freeze', icon: Snowflake, price: 100, desc: 'Protects Football streak for 1 day.', type: 'football' },
        { id: 'doubleXP', name: 'Field 2x XP', icon: Zap, price: 200, desc: 'Next Football session grants 2x XP.', type: 'football' },
        { id: 'tripleXP', name: 'Field 3x XP', icon: ArrowUpCircle, price: 500, desc: 'Next Football session grants 3x XP.', type: 'football' },
        { id: 'freeze', name: 'Gym Freeze', icon: Snowflake, price: 100, desc: 'Protects Gym streak for 1 day.', type: 'gym' },
        { id: 'doubleXP', name: 'Gym 2x XP', icon: Zap, price: 200, desc: 'Next Gym workout grants 2x XP.', type: 'gym' },
        { id: 'tripleXP', name: 'Gym 3x XP', icon: ArrowUpCircle, price: 500, desc: 'Next Gym workout grants 3x XP.', type: 'gym' },
    ];

    const buyItem = (item: typeof SHOP_ITEMS[0]) => {
        if (state.coins >= item.price) {
            // 1. Deduct Coins (Unified function)
            deductCoins(item.price);

            // 2. Update Inventory
            if (item.type === 'football') {
                const currentCount = football.inventory[item.id as keyof typeof football.inventory] || 0;
                updateFootball({
                    inventory: { ...football.inventory, [item.id]: currentCount + 1 }
                });
            } else if (item.type === 'gym') {
                 const currentCount = gym.inventory[item.id as keyof typeof gym.inventory] || 0;
                 updateGym({
                     inventory: { ...gym.inventory, [item.id]: currentCount + 1 }
                 });
            }
            
            sound.playCoin();
        } else {
            sound.playError();
        }
    };

    // Generate Chart Data (Last 7 Active Days - Skipping Rest Days)
    const data = React.useMemo(() => {
        const chartData = [];
        let daysFound = 0;
        let lookback = 0;
        
        // We want 7 active days
        while (daysFound < 7 && lookback < 21) { // Safety break at 3 weeks
            const d = new Date();
            d.setDate(d.getDate() - lookback);
            const key = getDateKey(d);
            const dayOfWeek = d.getDay();
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek];
            
            const isFbRest = state.football.trainingPlan[dayOfWeek]?.type === 'rest';
            const isGymRest = state.gym.trainingPlan[dayOfWeek]?.type === 'rest';
            const isColRest = dayOfWeek === 0 || dayOfWeek === 6; // Sat/Sun
            
            // A day is "Global Rest" if all ENABLED modules are resting
            const isGlobalRest = (
                (!state.enabledModules.football || isFbRest) &&
                (!state.enabledModules.gym || isGymRest) &&
                (!state.enabledModules.college || isColRest)
            );
            
            if (!isGlobalRest) {
                const fbScore = state.enabledModules.football 
                    ? (football.trainingHistory[key]?.completed ? 100 : (isFbRest ? null : 0)) 
                    : null;
                const gymScore = state.enabledModules.gym 
                    ? (gym.trainingHistory[key]?.completed ? 100 : (isGymRest ? null : 0)) 
                    : null;
                const colScore = state.enabledModules.college 
                    ? (college.attendanceHistory[key]?.status === 'present' ? 100 : (isColRest ? null : 0)) 
                    : null;
                
                chartData.unshift({
                    name: dayName,
                    ...(state.enabledModules.football && { Football: fbScore }),
                    ...(state.enabledModules.gym && { Gym: gymScore }),
                    ...(state.enabledModules.college && { College: colScore })
                });
                daysFound++;
            }
            lookback++;
        }
        return chartData;
    }, [football.trainingHistory, gym.trainingHistory, college.attendanceHistory, state.enabledModules, state.football.trainingPlan, state.gym.trainingPlan]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Layers size={200} />
                </div>
                
                <div className="z-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        NEURALIS Dashboard
                    </h1>
                    <div className="flex gap-4 mt-4 justify-center md:justify-start">
                        <button onClick={() => setActiveTab('overview')} className={clsx("px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap", activeTab === 'overview' ? "bg-white/10 text-white" : "text-gray-500 hover:text-white")}>Overview</button>
                        <button onClick={() => setActiveTab('market')} className={clsx("px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-2", activeTab === 'market' ? "bg-accent/20 text-accent" : "text-gray-500 hover:text-white")}>
                            <ShoppingBag size={14} /> Black Market
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4 z-10 w-full md:w-auto">
                     <div className="text-center px-2 md:px-6 border-r border-white/10">
                        <p className="text-xl md:text-3xl font-display font-bold text-white">{averageLevel}</p>
                        <p className="text-[8px] md:text-xs text-gray-500 uppercase font-bold">Avg Level</p>
                    </div>
                    <div className="text-center px-2 md:px-6 border-r border-white/10">
                        <p className="text-xl md:text-3xl font-display font-bold text-gold">{totalCoins}</p>
                        <p className="text-[8px] md:text-xs text-gray-500 uppercase font-bold">Coins</p>
                    </div>
                    <div className="text-center px-2 md:px-6">
                        <p className={clsx("text-xl md:text-3xl font-display font-bold", Math.max(football.currentStreak, gym.currentStreak) > 0 ? "text-orange-500" : "text-white")}>
                            {Math.max(football.currentStreak, gym.currentStreak)}
                        </p>
                        <p className="text-[8px] md:text-xs text-gray-500 uppercase font-bold">Streak</p>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Daily Bounties */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Target className="text-accent" size={20} /> Daily Bounties
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {dailyBounties.tasks.map((task) => (
                                <div 
                                    key={task.id} 
                                    onClick={() => !task.completed && completeBounty(task.id)}
                                    className={clsx(
                                        "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                                        task.completed 
                                            ? "bg-success/10 border-success/30 opacity-60" 
                                            : "bg-white/5 border-white/10 hover:border-accent/50 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                            task.type === 'football' ? "bg-purple-500/20 text-purple-400" :
                                            task.type === 'gym' ? "bg-blue-500/20 text-blue-400" :
                                            task.type === 'college' ? "bg-emerald-500/20 text-emerald-400" :
                                            "bg-gray-500/20 text-gray-400"
                                        )}>
                                            {task.type}
                                        </span>
                                        {task.completed ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-gray-600 group-hover:text-accent" />}
                                    </div>
                                    <p className={clsx("font-bold mb-1", task.completed && "line-through")}>{task.label}</p>
                                    <p className="text-xs text-gold font-mono">+{task.reward} Coins</p>
                                    
                                    {/* Progress Bar for aesthetic */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-accent transition-all duration-500" style={{ width: task.completed ? '100%' : '0%' }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unified Activity Chart */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 h-[350px] flex flex-col">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Activity className="text-accent" size={20} /> 
                            <span>Weekly Output</span>
                        </h3>
                        <div className="flex-grow w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorFb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#9d4edd" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#9d4edd" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorGym" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ padding: 0 }}
                                    />
                                    {state.enabledModules.football && <Area type="monotone" dataKey="Football" stackId="1" stroke="#9d4edd" fill="url(#colorFb)" strokeWidth={2} connectNulls />}
                                    {state.enabledModules.gym && <Area type="monotone" dataKey="Gym" stackId="1" stroke="#3b82f6" fill="url(#colorGym)" strokeWidth={2} connectNulls />}
                                    {state.enabledModules.college && <Area type="monotone" dataKey="College" stackId="1" stroke="#10b981" fill="url(#colorCol)" strokeWidth={2} connectNulls />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Recent Achievements Grid */}
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Star className="text-gold" size={20} /> Unlocks
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                ...(state.enabledModules.football ? football.achievements : []),
                                ...(state.enabledModules.gym ? gym.achievements : []),
                                ...(state.enabledModules.college ? college.achievements : [])
                            ]
                                .filter(a => a.unlocked)
                                .slice(0, 6)
                                .map(ach => (
                                <div key={ach.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors">
                                    <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{ach.icon}</span>
                                    <div>
                                        <p className="font-bold text-sm text-white">{ach.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{ach.category}</p>
                                    </div>
                                </div>
                            ))}
                            {[
                                ...(state.enabledModules.football ? football.achievements : []),
                                ...(state.enabledModules.gym ? gym.achievements : []),
                                ...(state.enabledModules.college ? college.achievements : [])
                            ].filter(a => a.unlocked).length === 0 && (
                                <div className="col-span-full py-8 text-center border-2 border-dashed border-white/10 rounded-xl">
                                    <p className="text-gray-500 italic">No achievements unlocked yet.</p>
                                    <p className="text-xs text-accent mt-2">Complete your first session to begin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="animate-slide-up grid md:grid-cols-3 gap-6">
                    {/* Inventory */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><Package size={20} className="text-accent" /> Inventory</h3>
                        
                        {state.enabledModules.football && (
                            <div className="glass-panel p-4 rounded-2xl border border-white/10">
                                <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Football Gear</h4>
                                {Object.entries(football.inventory).map(([key, count]) => (
                                    <div key={`fb-${key}`} className="flex justify-between items-center mb-2 last:mb-0">
                                        <span className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-bold text-accent">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {state.enabledModules.gym && (
                            <div className="glass-panel p-4 rounded-2xl border border-white/10">
                                <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Gym Gear</h4>
                                {Object.entries(gym.inventory).map(([key, count]) => (
                                    <div key={`gym-${key}`} className="flex justify-between items-center mb-2 last:mb-0">
                                        <span className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-bold text-blue-400">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Shop */}
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><ShoppingBag size={20} className="text-gold" /> The Black Market</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {SHOP_ITEMS
                                .filter(item => state.enabledModules[item.type as keyof typeof state.enabledModules])
                                .map((item, idx) => (
                                <div key={`${item.id}-${item.type}-${idx}`} className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden group hover:border-accent/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={clsx("p-3 rounded-xl text-white group-hover:scale-110 transition-transform", item.type === 'gym' ? 'bg-blue-500/20' : 'bg-accent/20')}>
                                            <item.icon size={24} className={item.type === 'gym' ? 'text-blue-400' : 'text-accent'} />
                                        </div>
                                        <div className="bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-bold border border-gold/20">
                                            {item.price} Coins
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                    <p className="text-xs text-gray-400 mb-6 h-8 leading-tight">{item.desc}</p>
                                    <Button 
                                        className="w-full" 
                                        size="sm" 
                                        onClick={() => buyItem(item)}
                                        disabled={football.coins < item.price}
                                        variant={football.coins < item.price ? 'secondary' : 'primary'}
                                    >
                                        {football.coins < item.price ? 'Insufficient Funds' : 'Purchase'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};