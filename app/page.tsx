'use client'

import { signIn } from 'next-auth/react'
import Image from 'next/image'
import styles from '@/components/index.module.css'

export default function SignIn() {

  return (
      <div className="flex h-screen">
        <div className="w-3/5 hidden lg:flex flex-col bg-gradient-to-b from-white to-pink-200 relative">
          <div className="absolute top-6 left-10">
            <b className={styles.learnlabyLogo}>Learnlaby</b>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <Image
                src="/education-3d-ill.png"
                alt="Education Illustration"
                width={450}
                height={450}
                className={`object-contain max-w-full h-auto ${styles.bounceSoft}`}
            />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto flex items-center justify-center px-4">
          <form className="w-full bg-white p-6">
            <div className="flex justify-center mb-4">
              <Image
                  src="/favicon.ico"
                  alt="App Logo"
                  width={48}
                  height={48}
                  className="rounded"
              />
            </div>
            <h2 className="text-3xl font-medium mb-2 text-center text-purple-700">Welcome back</h2>
            <p className="text-black mb-8 text-center">Please sign in to your account</p>

            <button
                type="button"
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl mb-4 hover:bg-gray-100"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                  width="20"
                  height="20"
              >
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
  )
}