
interface AnalogSpeedometerProps {
  speedBytes: number
  speedText: string
}

export default function AnalogSpeedometer({ speedText }: AnalogSpeedometerProps) {
  return (
    <div className="flex items-center justify-between py-1 relative z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center border border-green-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">السرعة الكلية</span>
      </div>
      <div className="text-xl font-mono font-bold text-green-600 dark:text-green-400 tracking-wide drop-shadow-sm" dir="ltr">
        {speedText}
      </div>
    </div>
  )
}
