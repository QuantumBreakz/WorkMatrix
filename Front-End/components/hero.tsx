"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-background to-background dark:from-blue-500/10 dark:via-background dark:to-background" />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -100, y: -100 }}
          animate={{ opacity: 0.5, x: 0, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, x: 100, y: 100 }}
          animate={{ opacity: 0.4, x: 0, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute top-40 -right-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.4 }}
          className="absolute bottom-20 left-1/4 h-60 w-60 rounded-full bg-blue-400/20 blur-3xl"
        />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="container mx-auto px-4 h-full relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute top-20 right-10 md:right-20 w-16 h-16 animate-float"
          >
            <Image
              src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png"
              alt="Clock icon"
              width={64}
              height={64}
              className="opacity-70"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="absolute top-40 left-10 md:left-20 w-12 h-12 animate-float-delay-1"
          >
            <Image
              src="https://cdn-icons-png.flaticon.com/512/1584/1584942.png"
              alt="Chart icon"
              width={48}
              height={48}
              className="opacity-70"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="absolute bottom-20 right-1/4 w-14 h-14 animate-float-delay-2"
          >
            <Image
              src="https://cdn-icons-png.flaticon.com/512/1589/1589592.png"
              alt="Task icon"
              width={56}
              height={56}
              className="opacity-70"
            />
          </motion.div>
        </div>
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="inline-block mb-4 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium dark:bg-blue-900/30 dark:text-blue-300"
          >
            Productivity Reimagined
          </motion.div>

          <motion.h1
            className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="block">Monitor Your Team's</span>
            <span className="text-blue-600">Productivity</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-xl text-slate-600 dark:text-slate-300 md:text-2xl max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            WorkMatrix helps you track time, monitor activity, and improve team performance with powerful analytics.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/register/employee">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Get Started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </Link>
            <div className="flex gap-4">
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-8 py-6 text-lg rounded-lg"
                >
                  Learn More
                </Button>
              </Link>
              <Link href="/dashboard/overview">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 px-8 py-6 text-lg rounded-lg"
                >
                  Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16 relative z-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <div className="relative mx-auto max-w-5xl rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 backdrop-blur-sm z-10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="bg-white/90 dark:bg-slate-900/90 p-6 rounded-xl shadow-lg max-w-lg text-center"
              >
                <h3 className="text-xl font-bold text-blue-600 mb-2">Boost Team Productivity</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Monitor performance, track time, and optimize workflow with our comprehensive dashboard
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Explore Features
                  </Button>
                  <Link href="/dashboard/overview">
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-600">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
            <Image
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="WorkMatrix Dashboard Preview"
              width={1280}
              height={720}
              className="w-full h-auto object-cover"
              priority
              quality={85}
            />
          </div>

          {/* Stats overlay */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 md:p-6"
            >
              <div className="text-center">
                <div className="text-blue-600 font-bold text-2xl md:text-3xl">30%</div>
                <div className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Productivity Boost</div>
              </div>
              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <div className="text-blue-600 font-bold text-2xl md:text-3xl">15k+</div>
                <div className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Teams Worldwide</div>
              </div>
              <div className="text-center">
                <div className="text-blue-600 font-bold text-2xl md:text-3xl">99.9%</div>
                <div className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Uptime Guarantee</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
