"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { Film, Loader2 } from "lucide-react"
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [mobile, setMobile] = useState("")
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState("")
  const [usernameStatusColor, setUsernameStatusColor] = useState("")

  const { signIn, signUp, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()

  // Username availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (!displayName || isLogin) {
        setUsernameStatus("")
        return
      }

      if (displayName.length < 6) {
        setUsernameStatus("Username must be at least 6 characters.")
        setUsernameStatusColor("text-yellow-500")
        return
      }

      setUsernameStatus("Checking availability...")
      setUsernameStatusColor("text-blue-500")

      try {
        // NOTE: Using a hardcoded appId 'movie-reporter' to match the context or snippet assumption.
        // The snippet used `artifacts/${appId}/users`. Context uses `artifacts/default-app-id/users`.
        const usersRef = collection(db, "artifacts/default-app-id/users")
        const q = query(usersRef, where("username", "==", displayName), limit(1))
        const snap = await getDocs(q)

        if (snap.empty) {
          setUsernameStatus("Username is available!")
          setUsernameStatusColor("text-green-500")
        } else {
          setUsernameStatus("Username is already taken.")
          setUsernameStatusColor("text-red-500")
        }
      } catch (error) {
        console.error("Error checking username:", error)
        setUsernameStatus("Error checking username.")
        setUsernameStatusColor("text-red-500")
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [displayName, isLogin])


  const isValidEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
  const isValidMobileNumber = (str: string) => /^\+?[0-9]{10}$/.test(str)

  const handleRegister = async () => {
    if (!displayName || !mobile || !email || !password || !confirmPassword) throw new Error("Please fill in all fields.")
    if (password !== confirmPassword) throw new Error("Passwords do not match.")
    if (password.length < 6) throw new Error("Password must be at least 6 characters.")
    if (!isValidEmail(email)) throw new Error("Invalid email address.")
    if (!isValidMobileNumber(mobile)) throw new Error("Invalid mobile number.")

    if (usernameStatus === "Username is already taken.") throw new Error("Username is already taken.")

    const usersRef = collection(db, "artifacts/default-app-id/users")
    const qMobile = query(usersRef, where("mobileNumber", "==", mobile))
    if (!(await getDocs(qMobile)).empty) throw new Error("Mobile number already registered.")

    // Using signUp from context which creates the user in Firebase Auth and Firestore
    // Note: The context's signUp doesn't take mobile number, so we might need to update the doc after code
    // OR we modify signUp in context. For now, let's update the doc here to ensure mobile is saved.
    await signUp(email, password, displayName)

    // We need to update the user doc with mobile number and username (if context didn't save username as 'username' field)
    // Context saves 'displayName' but snippet used 'username'. Let's save both or ensure consistency.
    // The snippet used `username, mobileNumber, role: 'user', status: 'active', createdAt`.
    // Context saves `displayName`. Let's add `username` and `mobileNumber`.

    // Since we don't have the uid here easily without signing in, and context's signUp waits for it.
    // Wait, context `signUp` logs the user in.
    // Let's assume signUp succeeds.
    // WE NEED THE UID. Context signUp doesn't return it.
    // But `signUp` signs the user in, so `auth.currentUser` should be set.

    // Actually, to be safe and cleaner, let's just let the context handle the basic creation
    // and then update the extra fields if we can get the user.
    // BUT context logic is: createUser -> updateProfile -> setDoc.
    // If we want to add mobile, we should probably do it in the context OR here using the auth object.

    // RE-READING: I can't easily access the just-created user's UID here if `signUp` doesn't return it.
    // However, `signUp` awaits `createUserWithEmailAndPassword`.
    // Let's just trust that if signUp throws, we catch it. If it succeeds, the user is logged in.
    // The `useAuth` hook exposes `user`.

    // BETTER APPROACH for this specific requirement: duplicate the creation logic here or update `signUp` in context to accept mobile.
    // I already updated `auth-context.tsx`. I should have added `mobile` there.
    // Let's just do the doc update here manually after `signUp`.
    // Wait, I can't guarantee `user` state is updated immediately in the component.

    // Let's use `signIn` and `signUp` from context but for the specific custom fields (mobile),
    // maybe we should just do the whole thing here like the snippet did?
    // The snippet used direct firebase functions.
    // Integrating with the Context is "cleaner" for the app state.
    // I will stick to using `signUp` and then `setDoc` with merge to add mobile/username.
  }

  const handleLoginLogic = async () => {
    if (!email || !password) throw new Error("Enter email/mobile and password.") // 'email' state is used for identifier

    let finalEmail = email

    if (isValidEmail(email)) {
      finalEmail = email
    } else if (isValidMobileNumber(email)) {
      const usersRef = collection(db, "artifacts/default-app-id/users")
      const q = query(usersRef, where("mobileNumber", "==", email), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) throw new Error("No account with this mobile number.")
      finalEmail = snap.docs[0].data().email
    } else {
      throw new Error("Invalid email or mobile number.")
    }

    await signIn(finalEmail, password)

    // Check status
    // valid user is now in `auth.currentUser` (managed by context)
    // We need to check the firestore doc for 'status'
    // We can do this by fetching the doc.
    // Note: `signIn` in context handles the auth part.
    // We can fetch the user doc here.
    // But `signIn` resolves void.
    // We can get the user from `auth.currentUser` (import auth from firebase)
    // OR just fetch by the uid we *don't have* yet?
    // `signIn` awaits `signInWithEmailAndPassword`, which returns a UserCredential.
    // The context function swallows the return value.
    // I should probably find the user by email???? No.

    // Accessing `auth.currentUser` directly should work after await `signIn`.
    // const currentUser = auth.currentUser;
    // if (currentUser) ...
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await handleLoginLogic()
        // Check status after login
        // We need to access auth directly or assume context updates?
        // Let's import auth from lib/firebase to be sure.
        const { auth } = await import("@/lib/firebase");
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, `artifacts/default-app-id/users/${auth.currentUser.uid}`))
          if (userDoc.exists() && userDoc.data().status === 'blocked') {
            await signOut()
            throw new Error('Your account is blocked.')
          }
        }

      } else {
        // Register
        await handleRegister()
        // Update mobile and username
        const { auth } = await import("@/lib/firebase");
        if (auth.currentUser) {
          await setDoc(doc(db, `artifacts/default-app-id/users/${auth.currentUser.uid}`), {
            username: displayName,
            mobileNumber: mobile,
            status: 'active'
          }, { merge: true });
        }
        toast.success('Registration successful! Redirecting...');
      }
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignInClick = async () => {
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      // Check if user exists in Firestore, if not create logic is needed?
      // The context `signInWithGoogle` just returns the user.
      // The snippet logic: check if exists, if not create. If exists, check block.

      const userRef = doc(db, `artifacts/default-app-id/users/${user.uid}`)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email || '',
          username: (user.displayName || 'user').replace(/\s+/g, '').toLowerCase(),
          mobileNumber: '',
          role: 'user',
          status: 'active',
          createdAt: Timestamp.now()
        });
      } else if (snap.data().status === 'blocked') {
        await signOut()
        throw new Error('Your account is blocked.')
      }

      toast.success('Signed in successfully!')
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Film className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your Movie Reporter account" : "Join the Movie Reporter community"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Username</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="johndoe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required={!isLogin}
                  />
                  {usernameStatus && <p className={`text-xs ${usernameStatusColor}`}>{usernameStatus}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="1234567890"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{isLogin ? "Email or Mobile" : "Email"}</Label>
              <Input
                id="email"
                type="text"
                placeholder={isLogin ? "you@example.com or mobile" : "you@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignInClick} disabled={loading}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Google
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>

            <div className="text-sm text-center">
              <a href="#" className="text-xs text-muted-foreground hover:underline">Forgot password?</a>
            </div>

          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
