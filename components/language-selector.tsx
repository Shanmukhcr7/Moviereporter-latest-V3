"use client"

import { useState, useEffect } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi (हिंदी)" },
    { code: "te", name: "Telugu (తెలుగు)" },
    { code: "ta", name: "Tamil (தமிழ்)" },
    { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
    { code: "ml", name: "Malayalam (മലയാളം)" },
    { code: "gu", name: "Gujarati (ગુજરાતી)" },
    { code: "mr", name: "Marathi (मराठी)" },
    { code: "bn", name: "Bengali (বাংলা)" },
    { code: "or", name: "Odia (ଓଡ଼ିଆ)" },
]

export function LanguageSelector() {
    const [currentLang, setCurrentLang] = useState("en")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Function to initialize Google Translate
        const initGoogleTranslate = () => {
            // @ts-ignore
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                // @ts-ignore
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages: "en,hi,te,ta,kn,ml,gu,mr,bn,or",
                        autoDisplay: false,
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                    },
                    "google_translate_element"
                )
            }
        }

        // Assign to global for the script callback
        // @ts-ignore
        window.googleTranslateElementInit = initGoogleTranslate

        const scriptId = "google-translate-script"
        let script = document.getElementById(scriptId) as HTMLScriptElement

        if (!script) {
            script = document.createElement("script")
            script.id = scriptId
            script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            script.async = true
            document.body.appendChild(script)
        } else {
            // Script already loaded, manual init
            initGoogleTranslate()
        }

        // Fallback check in case callback missed or script already loaded but not init
        const checkInterval = setInterval(() => {
            // @ts-ignore
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                const el = document.getElementById("google_translate_element")
                // If element exists but empty, try init
                if (el && !el.hasChildNodes()) {
                    initGoogleTranslate()
                }
            }
        }, 1000)

        return () => clearInterval(checkInterval)
    }, [])

    const changeLanguage = (langCode: string) => {
        const select = document.querySelector(".goog-te-combo") as HTMLSelectElement
        if (select) {
            select.value = langCode
            select.dispatchEvent(new Event("change", { bubbles: true }))
            setCurrentLang(langCode)
        } else {
            // Fallback: Set cookie and reload
            // @ts-ignore
            document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`
            // @ts-ignore
            document.cookie = `googtrans=/auto/${langCode}; path=/;`
            setCurrentLang(langCode)
            window.location.reload()
        }
    }

    if (!mounted) return null

    return (
        <>
            {/* Google Translate Element - Must be present in DOM but hidden visually */}
            <div id="google_translate_element" className="fixed bottom-0 right-0 pointer-events-none opacity-0 w-px h-px overflow-hidden" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Languages className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={currentLang === lang.code ? "bg-accent" : ""}
                        >
                            {lang.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
