import Image from 'next/image';

export function Footer() {
  return (
    <footer className="w-full bg-white pt-16 pb-8 mt-auto">
      <div className="w-full max-w-360 mx-auto px-5 md:px-15 flex flex-col gap-8">
        
        {/* Top Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-h5 md:text-h4 font-bold text-primary-600">
            HUT RI 81
          </h2>
          <p className="text-body-2 md:text-body-1 text-neutral-400 max-w-lg leading-relaxed">
            Pesta Rakyat Semarak Kemerdekaan Republik Indonesia ke- 81. Wadah Kebersamaan, gotong royong, dan perlombaan warga.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-neutral-200" />

        {/* Bottom Section */}
        <div className="flex items-center gap-2">
          <Image
            src="/icons/copy_right_icon.svg"
            alt="Copyright"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <p className="text-body-3 md:text-body-2 text-neutral-400 font-medium">
            Panitia HUT RI ke- 81. Dirgahayu Republik Indonesia
          </p>
        </div>

      </div>
    </footer>
  );
}
