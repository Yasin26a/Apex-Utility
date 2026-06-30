import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sliders, RefreshCw, Calculator, ShieldCheck, Heart, Flame } from 'lucide-react';

export default function BMICalculator() {
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState<number>(70); // kg or lbs
  const [height, setHeight] = useState<number>(175); // cm or inches
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activity, setActivity] = useState<number>(1.2); // BMR multiplier

  const [bmi, setBmi] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState<string>('Normal');
  const [bmr, setBmr] = useState<number>(0);
  const [dailyCalories, setDailyCalories] = useState<number>(0);

  const calculateBmi = () => {
    let bmiValue = 0;
    let bmrValue = 0;

    if (unitSystem === 'metric') {
      // BMI = kg / (m)^2
      const hM = height / 100;
      if (hM > 0) bmiValue = weight / (hM * hM);

      // Harris-Benedict BMR
      if (gender === 'male') {
        bmrValue = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmrValue = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    } else {
      // Imperial BMI = (lbs / (inches)^2) * 703
      if (height > 0) bmiValue = (weight / (height * height)) * 703;

      // Imperial BMR
      const wKg = weight * 0.453592;
      const hCm = height * 2.54;
      if (gender === 'male') {
        bmrValue = 88.362 + (13.397 * wKg) + (4.799 * hCm) - (5.677 * age);
      } else {
        bmrValue = 447.593 + (9.247 * wKg) + (3.098 * hCm) - (4.330 * age);
      }
    }

    setBmi(Number(bmiValue.toFixed(1)));
    setBmr(Number(bmrValue.toFixed(0)));
    setDailyCalories(Number((bmrValue * activity).toFixed(0)));

    // Categorization
    if (bmiValue < 18.5) {
      setBmiCategory('Underweight');
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      setBmiCategory('Normal weight');
    } else if (bmiValue >= 25 && bmiValue < 30) {
      setBmiCategory('Overweight');
    } else {
      setBmiCategory('Obese');
    }
  };

  useEffect(() => {
    calculateBmi();
  }, [weight, height, age, gender, activity, unitSystem]);

  // Adjust defaults when unit system shifts
  useEffect(() => {
    if (unitSystem === 'metric') {
      setWeight(70);
      setHeight(175);
    } else {
      setWeight(154);
      setHeight(68);
    }
  }, [unitSystem]);

  return (
    <div className="space-y-6" id="bmi-calculator-root">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-indigo-400" />
          <span>Precision BMI &amp; Calorie Calculator</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Analyze personal body mass indexes (BMI), compile target Basal Metabolic Rates (BMR), and customize daily caloric targets based on specific workout levels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup inputs */}
        <div className="lg:col-span-5 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Biometric Indexes</span>
            </h3>
            
            <div className="flex gap-1 border border-zinc-900 p-0.5 rounded bg-zinc-950/40">
              {(['metric', 'imperial'] as const).map((sys) => (
                <button
                  key={sys}
                  onClick={() => setUnitSystem(sys)}
                  className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold transition-all cursor-pointer ${
                    unitSystem === sys ? 'bg-indigo-600 text-white' : 'text-zinc-500'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Weight input slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">1. Body Weight</span>
                <span className="text-indigo-400 font-bold">{weight} {unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
              </div>
              <input
                type="range"
                min={unitSystem === 'metric' ? '30' : '70'}
                max={unitSystem === 'metric' ? '180' : '400'}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Height input slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-400">2. Body Height</span>
                <span className="text-indigo-400 font-bold">{height} {unitSystem === 'metric' ? 'cm' : 'inches'}</span>
              </div>
              <input
                type="range"
                min={unitSystem === 'metric' ? '120' : '45'}
                max={unitSystem === 'metric' ? '220' : '90'}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Age selector */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Age Years
                </span>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-900 text-xs font-mono text-zinc-300 rounded p-1 focus:outline-none"
                />
              </div>

              <div className="space-y-1 bg-zinc-950 p-2.5 rounded border border-zinc-900">
                <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Gender Target
                </span>
                <div className="flex gap-1 pt-1">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1 rounded border text-[9px] font-mono font-bold uppercase cursor-pointer ${
                        gender === g
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          : 'bg-zinc-900 border-zinc-900 text-zinc-500'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Workout activity drop */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-900">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                3. Weekly Workout Density index
              </span>
              <select
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-900 rounded p-2 text-xs text-zinc-400 focus:outline-none"
              >
                <option value={1.2}>Sedentary (No workouts / Office layout)</option>
                <option value={1.375}>Lightly active (1-3 sessions / week)</option>
                <option value={1.55}>Moderately active (3-5 sessions / week)</option>
                <option value={1.725}>Highly active (6-7 sessions / week)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Readout metrics panel */}
        <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-xl border border-zinc-900 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4 w-full flex-1 flex flex-col">
            <h3 className="text-zinc-200 text-xs font-mono font-bold uppercase tracking-wider border-b border-zinc-900 pb-2">
              Personal Body metrics analysis
            </h3>

            {/* BMI Category readout header */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Calculated Body Mass Index</span>
                <span className="text-2xl font-mono font-black text-indigo-400">{bmi} BMI</span>
              </div>
              <div className="text-right space-y-0.5">
                <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Category</span>
                <span className={`text-xs font-mono font-bold uppercase px-2 py-1 rounded border ${
                  bmiCategory === 'Normal weight'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {bmiCategory}
                </span>
              </div>
            </div>

            {/* Daily caloric goals */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-zinc-900 pt-3 flex-1">
              {/* BMR */}
              <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-900 text-xs flex flex-col justify-between">
                <div className="space-y-0.5">
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Basal Metabolic Rate (BMR)
                  </span>
                  <span className="font-mono text-zinc-200 text-xl font-bold">{bmr} kcal</span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal pt-2">
                  Calories burned simply surviving at total rest.
                </p>
              </div>

              {/* Maintenance */}
              <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-900 text-xs flex flex-col justify-between">
                <div className="space-y-0.5">
                  <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">
                    Daily Maintenance target
                  </span>
                  <span className="font-mono text-indigo-400 text-xl font-bold flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse fill-orange-400" />
                    <span>{dailyCalories} kcal</span>
                  </span>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal pt-2">
                  Daily calorie budget matching your selected activity intensity level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
