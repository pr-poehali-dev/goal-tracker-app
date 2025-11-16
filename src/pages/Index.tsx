import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type Period = 'day' | 'month' | 'year' | 'custom';
type PeriodType = 'preset' | 'custom';

interface Goal {
  id: number;
  title: string;
  period: Period;
  period_type: PeriodType;
  start_date?: string;
  end_date?: string;
  completed: boolean;
  created_at: string;
}

const API_URL = 'https://functions.poehali.dev/110cfe11-a556-4d7e-9e5d-7f6a8755b13a';

const Index = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalPeriod, setNewGoalPeriod] = useState<Period>('day');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      toast.error('Ошибка загрузки целей');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (period: Period) => {
    const periodGoals = goals.filter(g => g.period === period && g.period_type === 'preset');
    if (periodGoals.length === 0) return 0;
    const completed = periodGoals.filter(g => g.completed).length;
    return Math.round((completed / periodGoals.length) * 100);
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) {
      toast.error('Введите название цели');
      return;
    }

    if (newGoalPeriod === 'custom' && (!startDate || !endDate)) {
      toast.error('Выберите даты начала и окончания');
      return;
    }
    
    try {
      const payload: any = {
        title: newGoalTitle,
        period: newGoalPeriod,
        period_type: newGoalPeriod === 'custom' ? 'custom' : 'preset',
      };

      if (newGoalPeriod === 'custom' && startDate && endDate) {
        payload.start_date = format(startDate, 'yyyy-MM-dd');
        payload.end_date = format(endDate, 'yyyy-MM-dd');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const newGoal = await response.json();
      setGoals([newGoal, ...goals]);
      setNewGoalTitle('');
      setNewGoalPeriod('day');
      setStartDate(undefined);
      setEndDate(undefined);
      setShowAddForm(false);
      toast.success('Цель добавлена! 🎯');
    } catch (error) {
      toast.error('Ошибка при добавлении цели');
    }
  };

  const toggleGoal = async (goal: Goal) => {
    const newCompleted = !goal.completed;
    
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          completed: newCompleted,
        }),
      });
      
      const updatedGoal = await response.json();
      setGoals(goals.map(g => g.id === goal.id ? updatedGoal : g));
      
      if (newCompleted) {
        toast.success('Отлично! Продолжай в том же духе! 🎉', {
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error('Ошибка при обновлении цели');
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      setGoals(goals.filter(g => g.id !== id));
      toast.info('Цель удалена');
    } catch (error) {
      toast.error('Ошибка при удалении цели');
    }
  };

  const getPeriodLabel = (goal: Goal) => {
    if (goal.period_type === 'custom' && goal.start_date && goal.end_date) {
      const start = format(new Date(goal.start_date), 'd MMM', { locale: ru });
      const end = format(new Date(goal.end_date), 'd MMM yyyy', { locale: ru });
      return `${start} - ${end}`;
    }
    const labels: Record<Period, string> = { day: 'День', month: 'Месяц', year: 'Год', custom: 'Свой период' };
    return labels[goal.period];
  };

  const getPeriodEmoji = (period: Period) => {
    const emojis: Record<Period, string> = { day: '☀️', month: '📅', year: '🎯', custom: '📆' };
    return emojis[period];
  };

  const dayProgress = calculateProgress('day');
  const monthProgress = calculateProgress('month');
  const yearProgress = calculateProgress('year');

  const customGoals = goals.filter(g => g.period_type === 'custom');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <p className="text-xl text-muted-foreground">Загрузка целей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-3">
            Мои Цели
          </h1>
          <p className="text-muted-foreground text-lg">Достигай больше каждый день! 🚀</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 animate-in fade-in slide-in-from-left duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">{getPeriodEmoji('day')}</span>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Сегодня</p>
                <p className="text-4xl font-bold">{dayProgress}%</p>
              </div>
            </div>
            <Progress value={dayProgress} className="h-3 bg-white/20" />
            <p className="text-white/90 text-sm mt-3">
              {goals.filter(g => g.period === 'day' && g.period_type === 'preset' && g.completed).length} из {goals.filter(g => g.period === 'day' && g.period_type === 'preset').length} целей
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 animate-in fade-in slide-in-from-bottom duration-500 delay-150">
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">{getPeriodEmoji('month')}</span>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Месяц</p>
                <p className="text-4xl font-bold">{monthProgress}%</p>
              </div>
            </div>
            <Progress value={monthProgress} className="h-3 bg-white/20" />
            <p className="text-white/90 text-sm mt-3">
              {goals.filter(g => g.period === 'month' && g.period_type === 'preset' && g.completed).length} из {goals.filter(g => g.period === 'month' && g.period_type === 'preset').length} целей
            </p>
          </Card>

          <Card className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 animate-in fade-in slide-in-from-right duration-500 delay-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-5xl">{getPeriodEmoji('year')}</span>
              <div className="text-right">
                <p className="text-white/80 text-sm font-medium">Год</p>
                <p className="text-4xl font-bold">{yearProgress}%</p>
              </div>
            </div>
            <Progress value={yearProgress} className="h-3 bg-white/20" />
            <p className="text-white/90 text-sm mt-3">
              {goals.filter(g => g.period === 'year' && g.period_type === 'preset' && g.completed).length} из {goals.filter(g => g.period === 'year' && g.period_type === 'preset').length} целей
            </p>
          </Card>
        </div>

        {customGoals.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Мои периоды 📆
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {customGoals.map((goal) => {
                const customPeriodGoals = customGoals.filter(g => 
                  g.start_date === goal.start_date && g.end_date === goal.end_date
                );
                const completed = customPeriodGoals.filter(g => g.completed).length;
                const progress = Math.round((completed / customPeriodGoals.length) * 100);
                
                return (
                  <Card 
                    key={`period-${goal.start_date}-${goal.end_date}`}
                    className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">📆</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{progress}%</p>
                      </div>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/20 mb-2" />
                    <p className="text-white/90 text-xs">
                      {goal.start_date && goal.end_date && (
                        <>
                          {format(new Date(goal.start_date), 'd MMM', { locale: ru })} - {format(new Date(goal.end_date), 'd MMM', { locale: ru })}
                        </>
                      )}
                    </p>
                    <p className="text-white/80 text-xs mt-1">
                      {completed} из {customPeriodGoals.length} целей
                    </p>
                  </Card>
                );
              }).filter((card, index, self) => 
                index === self.findIndex(c => c.key === card.key)
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Активные цели
          </h2>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Icon name="Plus" className="mr-2" size={20} />
            Добавить цель
          </Button>
        </div>

        {showAddForm && (
          <Card className="p-6 mb-6 border-2 border-purple-200 shadow-xl animate-in fade-in slide-in-from-top duration-300">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Название цели</label>
                <Input
                  placeholder="Например: Заниматься спортом 3 раза в неделю"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  className="text-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Период</label>
                <Select value={newGoalPeriod} onValueChange={(v) => setNewGoalPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">☀️ Дневная цель</SelectItem>
                    <SelectItem value="month">📅 Месячная цель</SelectItem>
                    <SelectItem value="year">🎯 Годовая цель</SelectItem>
                    <SelectItem value="custom">📆 Свой период</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newGoalPeriod === 'custom' && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Дата начала</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Icon name="Calendar" className="mr-2" size={16} />
                          {startDate ? format(startDate, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          locale={ru}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Дата окончания</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Icon name="Calendar" className="mr-2" size={16} />
                          {endDate ? format(endDate, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          locale={ru}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={addGoal} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                  <Icon name="Check" className="mr-2" size={18} />
                  Создать
                </Button>
                <Button onClick={() => {
                  setShowAddForm(false);
                  setStartDate(undefined);
                  setEndDate(undefined);
                }} variant="outline" className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {goals.map((goal, index) => (
            <Card 
              key={goal.id} 
              className="p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 animate-in fade-in slide-in-from-left"
              style={{
                borderLeftColor: goal.period === 'day' ? '#9b87f5' : 
                                 goal.period === 'month' ? '#D946EF' : 
                                 goal.period === 'year' ? '#F97316' : '#6366f1',
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={goal.completed}
                  onCheckedChange={() => toggleGoal(goal)}
                  className="mt-1 h-6 w-6 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-600 data-[state=checked]:to-pink-600"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {goal.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">{getPeriodEmoji(goal.period)}</span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {getPeriodLabel(goal)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Icon name="Trash2" size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {goals.length === 0 && (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="text-8xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">Пока нет целей</h3>
              <p className="text-muted-foreground">Добавьте первую цель и начните путь к успеху!</p>
            </div>
          )}
        </div>

        <footer className="mt-16 text-center pb-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md">
            <Icon name="TrendingUp" className="text-purple-600" size={20} />
            <p className="text-sm font-medium text-muted-foreground">
              Общий прогресс: <span className="font-bold text-purple-600">{goals.length > 0 ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100) : 0}%</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
