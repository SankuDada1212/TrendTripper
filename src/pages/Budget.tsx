import { useMemo, useState } from "react";
import { IndianRupee, Users, Plus, Download, BarChart3, AlertTriangle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TripMeta = {
  budget: number;
  categories: string[];
  categoryBudgets: Record<string, number>;
  numPeople: number;
};

type Expense = {
  trip: string;
  userId: number;
  category: string;
  amount: number;
  timestamp: string; // ISO
};

const Budget = () => {
  // Trip management state
  const [trips, setTrips] = useState<Record<string, TripMeta>>({});
  const [selectedTrip, setSelectedTrip] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Create / update trip form
  const [tripName, setTripName] = useState("");
  const [tripBudgetInput, setTripBudgetInput] = useState<string>("");
  const [tripPeopleInput, setTripPeopleInput] = useState<string>("");
  const availableCategories = ["Food","Lodging","Transport","Entertainment","Shopping","Misc"];
  const [categoryBudgetsInput, setCategoryBudgetsInput] = useState<Record<string, number>>({});
  const [categorySelect, setCategorySelect] = useState<string>("");
  const [categoryLimitInput, setCategoryLimitInput] = useState<string>("");

  // Add expense form
  const [expUserId, setExpUserId] = useState<string>("");
  const [expCategory, setExpCategory] = useState<string>("");
  const [expAmount, setExpAmount] = useState<string>("");

  const activeTrip = selectedTrip ? trips[selectedTrip] : undefined;
  const tripExpenses = useMemo(() => expenses.filter(e => e.trip === selectedTrip), [expenses, selectedTrip]);
  const totalSpent = useMemo(() => tripExpenses.reduce((s, e) => s + e.amount, 0), [tripExpenses]);
  const remaining = activeTrip ? Math.max(0, activeTrip.budget - totalSpent) : 0;
  const perCategoryBudget = 0; // deprecated, using categoryBudgets

  const groupedByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of (activeTrip?.categories || [])) map[c] = 0;
    for (const e of tripExpenses) map[e.category] = (map[e.category] || 0) + e.amount;
    return map;
  }, [tripExpenses, activeTrip]);

  const handleCreateOrUpdateTrip = () => {
    if (!tripName.trim()) {
      toast.error("Please provide a trip name");
      return;
    }
    const budget = parseFloat(tripBudgetInput || "");
    if (!Number.isFinite(budget) || budget <= 0) {
      toast.error("Please set a valid total budget");
      return;
    }
    const people = parseInt(tripPeopleInput || "");
    if (!Number.isFinite(people) || people <= 0) {
      toast.error("Number of people must be at least 1");
      return;
    }
    const categories = Object.keys(categoryBudgetsInput);
    if (categories.length === 0) {
      toast.error("Add at least one category with a limit");
      return;
    }
    setTrips(prev => ({
      ...prev,
      [tripName.trim()]: { budget, categories, categoryBudgets: { ...categoryBudgetsInput }, numPeople: people },
    }));
    setSelectedTrip(tripName.trim());
    toast.success(`Saved trip '${tripName.trim()}'`);
  };

  const handleAddExpense = () => {
    if (!selectedTrip) {
      toast.error("Select a trip first");
      return;
    }
    if (!activeTrip?.categories.includes(expCategory)) {
      toast.error("Choose a valid category");
      return;
    }
    const amount = parseFloat(expAmount || "");
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    // Check remaining category budget
    const catLimit = activeTrip.categoryBudgets[expCategory] ?? 0;
    const used = groupedByCategory[expCategory] || 0;
    const remainingCat = Math.max(0, catLimit - used);
    if (amount > remainingCat) {
      toast.error(`Exceeds remaining ${expCategory} limit (Remaining ₹${remainingCat.toLocaleString()})`);
      return;
    }
    const newExpense: Expense = {
      trip: selectedTrip,
      userId: parseInt(expUserId || "0") || 0,
      category: expCategory,
      amount: amount,
      timestamp: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
    toast.success(`Logged ₹${amount.toLocaleString()} → ${expCategory}`);
  };

  const exportCsv = () => {
    const rows = tripExpenses.map(e => ({ timestamp: e.timestamp, user_id: e.userId, category: e.category, amount: e.amount }));
    const header = "timestamp,user_id,category,amount\n";
    const csv = header + rows.map(r => `${r.timestamp},${r.user_id},${r.category},${r.amount}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTrip.replace(/\s+/g, "_")}_expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHtml = () => {
    if (!activeTrip) return;
    const rows = tripExpenses
      .sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(e => `<tr><td>${new Date(e.timestamp).toLocaleString()}</td><td>${e.userId}</td><td>${e.category}</td><td>₹${e.amount.toLocaleString()}</td></tr>`) 
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${selectedTrip} — Trip Report</title></head><body>
    <h1>${selectedTrip} — Trip Report</h1>
    <p>Budget: ₹${activeTrip.budget.toLocaleString()}</p>
    <p>Categories: ${activeTrip.categories.map(c=>`${c} (₹${(activeTrip.categoryBudgets[c]||0).toLocaleString()})`).join(', ')}</p>
    <h2>Transactions</h2>
    <table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>When</th><th>User</th><th>Category</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTrip.replace(/\s+/g, "_")}_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-sunset rounded-2xl mb-4">
            <IndianRupee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Budget Planner</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Create trips, log expenses, and track budget health.</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create / Manage Trip */}
          <Card className="card-glass lg:col-span-1">
            <CardHeader>
              <CardTitle>Create / Manage Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Trip Name</Label>
              <Input value={tripName} onChange={(e)=> setTripName(e.target.value)} placeholder="Summer Europe" />

              <Label>Total Budget (₹)</Label>
              <Input type="number" min={0} value={tripBudgetInput} onChange={(e)=> setTripBudgetInput(e.target.value)} placeholder="e.g., 150000" />

              <div className="space-y-2">
                <Label>Add Category & Limit</Label>
                <select
                  className="w-full h-10 rounded-md bg-background border px-3"
                  value={categorySelect}
                  onChange={(e)=> setCategorySelect(e.target.value)}
                >
                  <option value="">-- Choose category --</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c} disabled={c in categoryBudgetsInput}>{c}</option>
                  ))}
                </select>
                <Input type="number" min={0} value={categoryLimitInput} onChange={(e)=> setCategoryLimitInput(e.target.value)} placeholder="Category limit (₹)" />
                <Button
                  type="button"
                  onClick={() => {
                    const limit = parseFloat(categoryLimitInput || "");
                    if (!categorySelect) { toast.error("Choose a category"); return; }
                    if (!Number.isFinite(limit) || limit <= 0) { toast.error("Enter a valid limit"); return; }
                    setCategoryBudgetsInput(prev => ({ ...prev, [categorySelect]: limit }));
                    setCategorySelect("");
                    setCategoryLimitInput("");
                  }}
                  className="w-full"
                  variant="outline"
                >Add</Button>
                {Object.keys(categoryBudgetsInput).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {Object.entries(categoryBudgetsInput).map(([c, v]) => (
                      <div key={c} className="flex justify-between">
                        <span>{c}</span><span>₹{(v as number).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Label>Number of People</Label>
              <Input type="number" min={1} value={tripPeopleInput} onChange={(e)=> setTripPeopleInput(e.target.value)} placeholder="e.g., 2" />

              <Button onClick={handleCreateOrUpdateTrip} className="w-full"><Plus className="w-4 h-4 mr-2" /> Save Trip</Button>

              {Object.keys(trips).length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label>Select Trip</Label>
                  <select
                    className="w-full h-10 rounded-md bg-background border px-3"
                    value={selectedTrip}
                    onChange={(e)=> setSelectedTrip(e.target.value)}
                  >
                    <option value="">-- Choose --</option>
                    {Object.keys(trips).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Panels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {activeTrip ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Budget</div>
                      <div className="text-2xl font-bold">₹{activeTrip.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                      <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-1">Per person: ₹{(totalSpent / Math.max(1, activeTrip.numPeople)).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Remaining</div>
                      <div className="text-2xl font-bold">₹{remaining.toLocaleString()}</div>
                      <div className="h-2 bg-muted rounded mt-2 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, activeTrip.budget ? (totalSpent/activeTrip.budget*100) : 0)}%` }} />
                  </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Create or select a trip to see overview.</div>
                )}
              </CardContent>
            </Card>

            {/* Add Expense */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle>Log Expense</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>User ID</Label>
                  <Input type="number" min={1} value={expUserId} onChange={(e)=> setExpUserId(e.target.value)} placeholder="e.g., 1" />
                </div>
                <div>
                  <Label>Category</Label>
                  <select className="w-full h-10 rounded-md bg-background border px-3" value={expCategory} onChange={(e)=> setExpCategory(e.target.value)}>
                    <option value="">-- Choose --</option>
                    {(activeTrip?.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                      </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input type="number" min={0} value={expAmount} onChange={(e)=> setExpAmount(e.target.value)} placeholder="e.g., 2500" />
                  </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleAddExpense}><Plus className="w-4 h-4 mr-2"/> Add</Button>
                </div>
            </CardContent>
          </Card>

            {/* Tabs: Breakdown, Alerts, Compare, Export */}
            <Tabs defaultValue="breakdown">
              <TabsList>
                <TabsTrigger value="breakdown"><BarChart3 className="w-4 h-4 mr-2"/>Breakdown</TabsTrigger>
                <TabsTrigger value="alerts"><AlertTriangle className="w-4 h-4 mr-2"/>Alerts</TabsTrigger>
                <TabsTrigger value="compare"><Users className="w-4 h-4 mr-2"/>Compare</TabsTrigger>
                <TabsTrigger value="export"><Download className="w-4 h-4 mr-2"/>Export</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTrip ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTrip.categories.map((cat) => {
                          const limit = activeTrip.categoryBudgets[cat] || 0;
                          const used = groupedByCategory[cat] || 0;
                          const remainingCat = Math.max(0, limit - used);
                          const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                          const status = pct < 70 ? "Good" : pct <= 100 ? "Caution" : "Exceeded";
                          const statusColor = pct < 70 ? "#10b981" : pct <= 100 ? "#f59e0b" : "#ef4444";
                          return (
                            <div key={cat} className="border rounded-lg p-4">
                              <div className="flex justify-between text-sm mb-2"><span className="font-medium">{cat}</span><span>Used: ₹{used.toLocaleString()}</span></div>
                              <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }}/></div>
                              <div className="text-xs mt-2" style={{ color: statusColor }}>Status: <strong>{status}</strong> • Limit ₹{limit.toLocaleString()} • Remaining ₹{remainingCat.toLocaleString()}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No trip selected.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Smart Alerts & Badges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTrip ? (
                      <div className="space-y-3">
                        {activeTrip.categories.map(cat => {
                          const used = groupedByCategory[cat] || 0;
                          const pct = perCategoryBudget > 0 ? (used / perCategoryBudget) * 100 : 0;
                          if (pct <= 80) return null;
                          return (
                            <div key={cat} className="border rounded p-3 text-sm">
                              {pct > 100 ? (
                                <div className="text-red-500 font-semibold">🚨 {cat} exceeded budget: ₹{used.toLocaleString()} / ₹{perCategoryBudget.toLocaleString()} ({pct.toFixed(1)}%)</div>
                              ) : (
                                <div className="text-amber-500 font-semibold">⚠️ {cat} at {pct.toFixed(1)}% of its limit.</div>
                              )}
                            </div>
                          );
                        })}

                        {/* Badges */}
                        <div className="pt-2">
                          <h4 className="font-semibold mb-2 flex items-center"><Award className="w-4 h-4 mr-2"/>Badges</h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {remaining >= activeTrip.budget * 0.1 && (
                              <span className="px-2 py-1 rounded-full text-white" style={{ background: "linear-gradient(90deg,#2dd4bf,#059669)" }}>Smart Saver</span>
                            )}
                            {activeTrip.categories.every(c => (groupedByCategory[c] || 0) <= perCategoryBudget + 1e-6) && (
                              <span className="px-2 py-1 rounded-full text-white" style={{ background: "linear-gradient(90deg,#7c4dff,#3f51b5)" }}>Balanced Traveler</span>
                            )}
                            {totalSpent <= activeTrip.budget * 0.4 && (
                              <span className="px-2 py-1 rounded-full text-white" style={{ background: "linear-gradient(90deg,#ffb86b,#ff6b6b)" }}>Mindful Spender</span>
                            )}
                            {remaining < activeTrip.budget * 0.1 && totalSpent > activeTrip.budget * 0.9 && (
                              <span className="px-2 py-1 rounded-full bg-muted">Keep Going!</span>
                            )}
                        </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No trip selected.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compare">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Compare Trips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(trips).length < 2 ? (
                      <div className="text-muted-foreground">Create at least two trips to compare.</div>
                    ) : (
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left">
                              <th className="py-2 pr-4">Trip</th>
                              <th className="py-2 pr-4">Budget</th>
                              <th className="py-2 pr-4">Spent</th>
                              <th className="py-2 pr-4">Remaining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(trips).map(([name, meta]) => {
                              const spent = expenses.filter(e => e.trip === name).reduce((s, e) => s + e.amount, 0);
                              return (
                                <tr key={name} className="border-t">
                                  <td className="py-2 pr-4">{name}</td>
                                  <td className="py-2 pr-4">₹{meta.budget.toLocaleString()}</td>
                                  <td className="py-2 pr-4">₹{spent.toLocaleString()}</td>
                                  <td className="py-2 pr-4">₹{(meta.budget - spent).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="export">
                <Card className="card-glass">
                  <CardHeader>
                    <CardTitle>Export</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button onClick={exportCsv} disabled={!selectedTrip}><Download className="w-4 h-4 mr-2"/>CSV</Button>
                    <Button onClick={exportHtml} variant="outline" disabled={!selectedTrip}><Download className="w-4 h-4 mr-2"/>HTML</Button>
                </CardContent>
              </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
