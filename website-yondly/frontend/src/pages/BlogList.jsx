import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ChevronRight, Tag, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/shared/SEO';
import { blogService } from '../services/blogService';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const BlogList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await blogService.getAll();
                setPosts(data);
            } catch (error) {
                console.error('Failed to load blog posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);
    return (
        <div className="min-h-screen bg-gray-50/50">
            <SEO
                title="Le Journal Yondly - Actualités, Astuces & Anti-gaspi"
                description="Retrouvez nos meilleurs conseils pour réduire le gaspillage, consommer local et tout savoir sur l'actualité de Yondly."
                keywords="blog, actualités, astuces, anti-gaspi, local, consommation durable"
                url="/blog"
            />

            <Header />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-wash)] rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
                <div className="container-main relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-6">
                        📰 Le Journal
                    </span>
                    <h1 className="heading-1 mb-6">L'actualité <span className="text-[var(--accent-primary)]">Yondly</span></h1>
                    <p className="body-large text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Astuces, guides pratiques et nouveautés. Plongez dans l'univers de l'économie locale et circulaire.
                    </p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-16">
                <div className="container-main">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-primary)]" />
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {posts.map((post) => (
                                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                                    <Card className="h-full border-[var(--border-light)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white rounded-3xl">
                                        {/* Blog Post Image */}
                                        <div className="h-48 relative overflow-hidden">
                                            <img
                                                src={post.image}
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {/* Overlay on hover */}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>

                                        <CardContent className="p-6 flex flex-col h-[calc(100%-12rem)]">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="px-3 py-1 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] text-xs font-bold uppercase tracking-wider">
                                                    {post.category}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {post.read_time || post.readTime}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>

                                            <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3">
                                                {post.excerpt}
                                            </p>

                                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    {post.author}
                                                </div>
                                                <span className="text-[var(--accent-primary)] font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    Lire
                                                    <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Newsletter / CTA */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="container-main">
                    <div className="bg-[var(--accent-primary)] rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-green-900/20">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Rien de mieux que le direct</h2>
                        <p className="text-green-50 text-lg mb-8 max-w-xl mx-auto relative z-10">
                            Téléchargez l'application Yondly pour accéder à toutes les offres et articles directement sur votre mobile.
                        </p>
                        <Link to="/beta" className="relative z-10">
                            <Button className="bg-white text-[var(--accent-primary)] hover:bg-green-50 font-bold px-8 py-6 rounded-full text-lg shadow-lg">
                                Télécharger l'app
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default BlogList;
