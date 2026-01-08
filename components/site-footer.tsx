
import { SocialMediaIcons } from "@/components/social-media-icons"
import { PWAInstallButton, PWAStoreBadges } from "@/components/pwa-install-button"

export function SiteFooter() {
    return (
        <footer className="border-t bg-background py-6 pb-24 md:pb-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    <p>© 2026 Movie Lovers. All rights reserved.</p>
                </div>
                <div className="flex flex-col items-center gap-4 md:items-end">
                    <SocialMediaIcons className="gap-6" iconSize="h-5 w-5" />
                    <PWAStoreBadges />
                </div>
            </div>
        </footer>
    )
}
