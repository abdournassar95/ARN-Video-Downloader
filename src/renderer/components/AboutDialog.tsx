
interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null

  const handleOpenLink = (url: string) => {
    if (window.api && typeof window.api.openExternal === 'function') {
      window.api.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const socialLinks = [
    {
      name: 'WhatsApp',
      url: 'https://wa.me/201556710314',
      title: '+201556710314',
      color: '#25D366',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.981-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.611 0-3.11-.475-4.372-1.292l-.313-.205-2.961.777.791-2.888-.225-.328A8.214 8.214 0 0 1 3.75 12c0-4.549 3.701-8.25 8.25-8.25s8.25 3.701 8.25 8.25-3.701 8.25-8.25 8.25z" />
        </svg>
      )
    },
    {
      name: 'Telegram',
      url: 'https://t.me/ABDOURNASSAR95',
      title: 'ABDOURNASSAR95',
      color: '#229ED9',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      )
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/abdouragab.nassar',
      title: 'abdouragab.nassar',
      color: '#1877F2',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: 'Messenger',
      url: 'https://m.me/abdouragab.nassar',
      title: 'abdouragab.nassar',
      color: '#00B2FF',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.734 7.218V22l3.376-1.852c.915.253 1.884.39 2.89.39 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.448l-2.723-2.904-5.309 2.904 5.84-6.198 2.79 2.904 5.243-2.904-5.841 6.198z" />
        </svg>
      )
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900/95 text-slate-100 rounded-3xl border border-slate-700/80 shadow-2xl p-6 overflow-hidden backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Logo Badge */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-xl shadow-blue-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900/80 rounded-[14px] flex flex-col items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                ARN
              </span>
              <span className="text-[9px] text-slate-400 tracking-widest font-semibold uppercase">
                TECH
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-1 tracking-wide">
            ARN - Video Downloader
          </h2>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-mono mb-4">
            <span>الإصدار</span>
            <span className="font-bold">v1.0.0</span>
          </div>

          {/* Developer Attribution */}
          <div className="py-2.5 px-4 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-5 w-full">
            <p className="text-sm font-semibold mb-1" style={{ color: '#10b981' }}>
              تطوير وبرمجة: عبده رجب نصار
            </p>
            <p className="text-xs text-slate-400">
              شركة ARN Technology للحلول التقنية والبرمجية
            </p>
          </div>

          {/* Social Links (Circular 25px radius buttons) */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {socialLinks.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleOpenLink(item.url)}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-700/80 bg-transparent text-slate-300 hover:text-white group relative shadow-sm"
                style={{
                  borderRadius: '25px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b'
                  e.currentTarget.style.borderColor = item.color
                  e.currentTarget.style.color = item.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.8)'
                  e.currentTarget.style.color = ''
                }}
                title={`${item.name} (${item.title})`}
              >
                {item.icon}
              </button>
            ))}
          </div>

          {/* Copyright notice */}
          <div className="pt-3 border-t border-slate-800/80 w-full text-center">
            <p className="text-[11px] text-slate-500">
              حقوق النشر &copy; 2026 لشركة ARN Technology. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
