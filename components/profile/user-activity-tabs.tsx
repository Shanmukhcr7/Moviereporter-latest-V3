"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserVotesList } from "./user-votes-list"
import { UserCommentsList } from "./user-comments-list"
import { UserReviewsList } from "./user-reviews-list"
import { InterestedMoviesList } from "./interested-movies-list"
import { SavedBlogsList } from "./saved-blogs-list"

export function UserActivityTabs() {
    return (
        <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">My Activity</TabsTrigger>
                <TabsTrigger value="saved">Saved & Interests</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Votes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserVotesList />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Comments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserCommentsList />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>My Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserReviewsList />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="saved">
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interested Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <InterestedMoviesList />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Blogs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SavedBlogsList />
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    )
}
