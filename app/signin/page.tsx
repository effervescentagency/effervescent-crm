'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function SignInContent() {
  const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
      const error = searchParams.get('error');

        return (
            <div className="min-h-screen bg-pink-50 flex items-center justify-center px-6">
                  <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
                          <div className="bg-pink-400 px-8 py-8 text-center">
                                    <div className="text-white font-bold text-2xl">Effervescent</div>
                                              <div className="text-pink-50 text-sm mt-1">Staff Dashboard</div>
                                                      </div>
                                                              <div className="px-8 py-8 text-center">
                                                                        <p className="text-gray-500 text-sm mb-6">
                                                                                    Sign in with your effervescent.agency work account to continue.
                                                                                              </p>
                                                                                                        {error && (
                                                                                                                    <p className="text-red-500 text-sm mb-4">
                                                                                                                                  Sign-in failed. Please use your effervescent.agency work email.
                                                                                                                                              </p>
                                                                                                                                                        )}
                                                                                                                                                                  <button
                                                                                                                                                                              onClick={() => signIn('google', { callbackUrl })}
                                                                                                                                                                                          className="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold rounded-xl py-3 transition"
                                                                                                                                                                                                    >
                                                                                                                                                                                                                Sign in with Google
                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                              export default function SignInPage() {
                                                                                                                                                                                                                                                return (
                                                                                                                                                                                                                                                    <Suspense fallback={null}>
                                                                                                                                                                                                                                                          <SignInContent />
                                                                                                                                                                                                                                                              </Suspense>
                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                