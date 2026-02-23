const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-cartoon-secondary/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-cartoon-text font-semibold">
              🎵 Practice Tracker
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Track your musical journey, one practice at a time
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">
              Made with 💖 for musicians everywhere
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © {new Date().getFullYear()} Practice Tracker
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
