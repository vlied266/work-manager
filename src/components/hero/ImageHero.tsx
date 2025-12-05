"use client";

import React from 'react';
import Image from 'next/image';

export default function ImageHero() {
  return (
    <div className="w-full h-[500px] relative flex items-center justify-center">
      <div className="relative w-full max-w-md h-full flex items-center justify-center">
        <Image
          src="/atomic-texture.png"
          alt="Atomic Work"
          width={600}
          height={600}
          className="object-contain w-full h-full"
          priority
        />
      </div>
    </div>
  );
}
