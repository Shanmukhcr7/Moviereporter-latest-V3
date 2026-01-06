
import { SocialMediaIcons } from "@/components/social-media-icons"

export function SiteFooter() {
    return (
        <footer className="border-t bg-background py-6 pb-24 md:pb-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <div className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    <p>© 2026 Movie Lovers. All rights reserved.</p>
                </div>
                <SocialMediaIcons className="gap-6" iconSize="h-5 w-5" />
            </div>
        </footer>
    )
}
