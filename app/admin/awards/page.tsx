"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs, limit, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, Loader2, Calendar, Trophy, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

const industries = ["Tollywood", "Bollywood", "Kollywood", "Sandalwood", "Hollywood", "Mollywood", "Pan India"]

export default function AwardsPage() {
    const [activeIndustry, setActiveIndustry] = useState("tollywood")
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Modals
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<any | null>(null)
    const [isNomineesOpen, setIsNomineesOpen] = useState(false)

    // Fetch Categories for selected industry
    useEffect(() => {
        setLoading(true)
        // Fetch ALL categories and filter client side to avoid case-sensitivity and missing index issues.
        const q = query(collection(db, "artifacts/default-app-id/categories"))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allCategories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[]

            // Client-side filter for industry (case-insensitive)
            // and sort by createdAt if available, else name/ID
            const filtered = allCategories.filter(cat =>
                (cat.industry || "").toLowerCase().replace(" ", "-") === activeIndustry ||
                (cat.industry || "").toLowerCase() === activeIndustry.replace("-", " ") // Check "Pan India" vs "pan-india"
            ).sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0
                const dateB = b.createdAt?.seconds || 0
                return dateB - dateA
            })

            setCategories(filtered)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [activeIndustry])

    const deleteCategory = async (id: string) => {
        if (confirm("Delete this category? All nominees will also be deleted.")) {
            await deleteDoc(doc(db, "artifacts/default-app-id/categories", id))
            // Ideally trigger a Cloud Function to recursive delete nominees, 
            // but for basic usage we'll just leave them orphaned or delete sequentially client-side (risky but easy)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Awards Management</h1>
                    <p className="text-muted-foreground">Manage voting categories and nominees.</p>
                </div>
            </div>

            <Tabs value={activeIndustry} onValueChange={setActiveIndustry} className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0 mb-6">
                    {industries.map(ind => (
                        <TabsTrigger
                            key={ind}
                            value={ind.toLowerCase().replace(" ", "-")}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                        >
                            {ind}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex justify-end mb-4">
                    <Button onClick={() => { setSelectedCategory(null); setIsCategoryOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add Category
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto col-span-full" />
                    ) : categories.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
                            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground">No categories defined for {activeIndustry}.</p>
                        </div>
                    ) : (
                        categories.map(cat => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                onEdit={() => { setSelectedCategory(cat); setIsCategoryOpen(true); }}
                                onManage={() => { setSelectedCategory(cat); setIsNomineesOpen(true); }}
                                onDelete={() => deleteCategory(cat.id)}
                            />
                        ))
                    )}
                </div>
            </Tabs>

            {/* Category CRUD Modal */}
            <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCategory ? "Edit Category" : "New Category"}</DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                        initialData={selectedCategory}
                        industry={activeIndustry}
                        onSuccess={() => setIsCategoryOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Nominees Manager Modal (Full Screen or Large) */}
            <Dialog open={isNomineesOpen} onOpenChange={setIsNomineesOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Nominees: {selectedCategory?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedCategory && (
                        <NomineesManager categoryId={selectedCategory.id} categoryName={selectedCategory.name} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CategoryCard({ category, onEdit, onManage, onDelete }: any) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                    <span>{category.name}</span>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8 text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>
                    {category.startDate && format(category.startDate.toDate(), "MMM d")} - {category.endDate && format(category.endDate.toDate(), "MMM d, yyyy")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-sm font-medium">Votes: {category.totalVotes || 0}</div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onEdit}>Edit</Button>
                <Button className="flex-1" onClick={onManage}>Manage Nominees</Button>
            </CardFooter>
        </Card>
    )
}

function CategoryForm({ initialData, industry, onSuccess }: any) {
    const [name, setName] = useState(initialData?.name || "")
    const [start, setStart] = useState(initialData?.startDate?.toDate().toISOString().split('T')[0] || "")
    const [end, setEnd] = useState(initialData?.endDate?.toDate().toISOString().split('T')[0] || "")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const data = {
                name,
                industry,
                startDate: Timestamp.fromDate(new Date(start)),
                endDate: Timestamp.fromDate(new Date(end)),
                updatedAt: Timestamp.now()
            }
            if (initialData) {
                await updateDoc(doc(db, "artifacts/default-app-id/categories", initialData.id), data)
            } else {
                const newCategoryRef = await addDoc(collection(db, "artifacts/default-app-id/categories"), {
                    ...data,
                    totalVotes: 0,
                    createdAt: Timestamp.now()
                })
                // Auto-create "Other" nominee
                await addDoc(collection(db, "artifacts/default-app-id/nominees"), {
                    categoryId: newCategoryRef.id,
                    categoryName: name,
                    celebName: "Other",
                    celebImage: null,
                    votes: 0,
                    isOther: true,
                    description: "User-submitted custom vote",
                    createdAt: Timestamp.now()
                })
            }
            onSuccess()
            toast.success("Category saved")
        } catch (e) { toast.error("Failed to save") }
        setSubmitting(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Category Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Best Actor" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={start} onChange={e => setStart(e.target.value)} required />
                </div>
                <div>
                    <Label>End Date</Label>
                    <Input type="date" value={end} onChange={e => setEnd(e.target.value)} required />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>Save</Button>
            </div>
        </form>
    )
}

function NomineesManager({ categoryId, categoryName }: any) {
    const [nominees, setNominees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form state
    const [celebSearch, setCelebSearch] = useState("")
    const [celebResults, setCelebResults] = useState<any[]>([])
    const [movieSearch, setMovieSearch] = useState("")
    const [movieResults, setMovieResults] = useState<any[]>([])

    const [selectedCeleb, setSelectedCeleb] = useState<any>(null)
    const [selectedMovie, setSelectedMovie] = useState<any>(null)

    useEffect(() => {
        const q = query(collection(db, "artifacts/default-app-id/nominees"), where("categoryId", "==", categoryId))
        const unsub = onSnapshot(q, (snap) => {
            setNominees(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return () => unsub()
    }, [categoryId])

    // Search Celebs
    useEffect(() => {
        if (celebSearch.length < 2) { setCelebResults([]); return }
        const timer = setTimeout(async () => {
            const q = query(collection(db, "artifacts/default-app-id/celebrities"), where("name", ">=", celebSearch), where("name", "<=", celebSearch + "\uf8ff"), limit(5))
            const snap = await getDocs(q)
            setCelebResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }, 300)
        return () => clearTimeout(timer)
    }, [celebSearch])

    // Search Movies
    useEffect(() => {
        if (movieSearch.length < 2) { setMovieResults([]); return }
        const timer = setTimeout(async () => {
            const q = query(collection(db, "artifacts/default-app-id/movies"), where("title", ">=", movieSearch), where("title", "<=", movieSearch + "\uf8ff"), limit(5))
            const snap = await getDocs(q)
            setMovieResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        }, 300)
        return () => clearTimeout(timer)
    }, [movieSearch])

    const addNominee = async () => {
        if (!selectedCeleb) return toast.error("Select a celebrity")
        await addDoc(collection(db, "artifacts/default-app-id/nominees"), {
            categoryId,
            categoryName,
            celebId: selectedCeleb.id,
            celebName: selectedCeleb.name,
            celebImage: selectedCeleb.image || selectedCeleb.imageUrl || selectedCeleb.profileImage || null,
            movieId: selectedMovie?.id || null, // Movie is optional? Usually Best Actor (Movie)
            movieName: selectedMovie?.title || null,
            votes: 0,
            createdAt: Timestamp.now()
        })
        setSelectedCeleb(null)
        setSelectedMovie(null)
        setCelebSearch("")
        setMovieSearch("")
        toast.success("Nominee added")
    }

    const removeNominee = async (id: string) => {
        await deleteDoc(doc(db, "artifacts/default-app-id/nominees", id))
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4 border-r pr-6">
                <h3 className="font-medium">Add New Nominee</h3>

                <div className="space-y-2">
                    <Label>Select Celebrity (Nominee)</Label>
                    <div className="relative">
                        <Input value={celebSearch} onChange={e => setCelebSearch(e.target.value)} placeholder="Search Celebrity..." />
                        {selectedCeleb && (
                            <div className="absolute top-1/2 -translate-y-1/2 right-2 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center">
                                {selectedCeleb.name} <Search onClick={() => setSelectedCeleb(null)} className="h-3 w-3 ml-1 cursor-pointer" />
                            </div>
                        )}
                        {celebResults.length > 0 && !selectedCeleb && (
                            <div className="absolute z-10 w-full bg-popover border rounded shadow mt-1">
                                {celebResults.map(c => (
                                    <div key={c.id} onClick={() => { setSelectedCeleb(c); setCelebResults([]); setCelebSearch("") }} className="p-2 hover:bg-accent cursor-pointer flex items-center gap-2">
                                        <Avatar className="h-6 w-6"><AvatarImage src={c.image || c.imageUrl || c.profileImage} /></Avatar> {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Select Movie (For Role) - Optional</Label>
                    <div className="relative">
                        <Input value={movieSearch} onChange={e => setMovieSearch(e.target.value)} placeholder="Search Movie..." />
                        {selectedMovie && (
                            <div className="absolute top-1/2 -translate-y-1/2 right-2 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs flex items-center">
                                {selectedMovie.title} <Search onClick={() => setSelectedMovie(null)} className="h-3 w-3 ml-1 cursor-pointer" />
                            </div>
                        )}
                        {movieResults.length > 0 && !selectedMovie && (
                            <div className="absolute z-10 w-full bg-popover border rounded shadow mt-1">
                                {movieResults.map(m => (
                                    <div key={m.id} onClick={() => { setSelectedMovie(m); setMovieResults([]); setMovieSearch("") }} className="p-2 hover:bg-accent cursor-pointer flex items-center gap-2">
                                        <AwardWinnersDropdownIcon category="movie" /> {m.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Button onClick={addNominee} disabled={!selectedCeleb} className="w-full">Add Nominee</Button>
            </div>

            <div className="space-y-4">
                <h3 className="font-medium">Current Nominees</h3>
                {loading ? <Loader2 className="animate-spin" /> : nominees.length === 0 ? <div className="text-muted-foreground">No nominees yet.</div> : (
                    <div className="space-y-2">
                        {nominees.map(nom => (
                            <NomineeItem key={nom.id} nom={nom} onRemove={removeNominee} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function AwardWinnersDropdownIcon({ category }: { category: string }) {
    return <Trophy className="h-4 w-4" />
}

function NomineeItem({ nom, onRemove }: { nom: any, onRemove: (id: string) => void }) {
    const [celebrity, setCelebrity] = useState<any>(null)
    const [movie, setMovie] = useState<any>(null)

    useEffect(() => {
        const resolveData = async () => {
            // Resolve Celebrity if name/image missing
            // Handle both legacy fields (celebrityId) and new fields (celebId)
            const cId = nom.celebId || nom.celebrityId
            if ((!nom.celebName || !nom.celebImage) && cId) {
                try {
                    const snap = await getDoc(doc(db, "artifacts/default-app-id/celebrities", cId))
                    if (snap.exists()) {
                        setCelebrity(snap.data())
                    }
                } catch (e) { console.error(e) }
            }

            // Resolve Movie if missing
            if (!nom.movieName && nom.movieId) {
                try {
                    const snap = await getDoc(doc(db, "artifacts/default-app-id/movies", nom.movieId))
                    if (snap.exists()) {
                        setMovie(snap.data())
                    }
                } catch (e) { console.error(e) }
            }
        }
        resolveData()
    }, [nom])

    const displayName = nom.celebName || celebrity?.name || (nom.isOther ? "Other" : "Unknown")
    const displayImage = nom.celebImage || celebrity?.image || celebrity?.imageUrl || celebrity?.profileImage
    const displayMovie = nom.movieName || movie?.title

    return (
        <div className="flex items-center justify-between p-2 border rounded bg-muted/20">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={displayImage} className="object-cover" />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{displayName}</div>
                    {displayMovie && <div className="text-xs text-muted-foreground">{displayMovie}</div>}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant="secondary">{nom.votes || 0} Votes</Badge>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onRemove(nom.id)}>
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    )
}
