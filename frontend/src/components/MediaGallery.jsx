import { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

const MediaGallery = ({ media }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    if (!media || media.length === 0) return null

    const currentMedia = media[currentIndex]
    const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:3000'

    const nextMedia = () => {
        setCurrentIndex((prev) => (prev + 1) % media.length)
    }

    const prevMedia = () => {
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
    }

    return (
        <>
            {/* Main Gallery */}
            <div className="my-4">
                {/* Main Media Display */}
                <div className="relative bg-black rounded-lg overflow-hidden group">
                    {currentMedia.mediaType === 'video' ? (
                        <video
                            key={currentMedia._id}
                            src={`${BASE_URL}${currentMedia.filepath}`}
                            controls
                            className="w-full max-h-[600px] object-contain"
                            title={currentMedia.caption || ''}
                        />
                    ) : (
                        <img
                            src={`${BASE_URL}${currentMedia.filepath}`}
                            alt={currentMedia.caption || 'Media'}
                            title={currentMedia.caption || ''}
                            className="w-full max-h-[600px] object-contain cursor-pointer"
                            onClick={() => setIsFullscreen(true)}
                        />
                    )}

                    {/* Navigation Arrows (only if multiple media) */}
                    {media.length > 1 && (
                        <>
                            <button
                                onClick={prevMedia}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextMedia}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    {/* Media Counter */}
                    {media.length > 1 && (
                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            {currentIndex + 1} / {media.length}
                        </div>
                    )}

                    {/* Fullscreen Button (images only) */}
                    {currentMedia.mediaType === 'image' && (
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Maximize2 size={20} />
                        </button>
                    )}
                </div>

                {/* Thumbnails (only if multiple media) */}
                {media.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {media.map((item, index) => (
                            <button
                                key={item._id}
                                onClick={() => setCurrentIndex(index)}
                                className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${index === currentIndex
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                {item.mediaType === 'video' ? (
                                    <div className="relative w-full h-full bg-black">
                                        <video
                                            src={`${BASE_URL}${item.filepath}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                                                <div className="w-0 h-0 border-l-4 border-l-black border-y-3 border-y-transparent ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={`${BASE_URL}${item.filepath}`}
                                        alt={item.caption || `Media ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && currentMedia.mediaType === 'image' && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={`${BASE_URL}${currentMedia.filepath}`}
                        alt={currentMedia.caption || 'Media'}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {currentMedia.caption && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded max-w-2xl text-center">
                            {currentMedia.caption}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default MediaGallery
