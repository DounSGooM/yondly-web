import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Facebook, Twitter, Linkedin, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/shared/SEO';
import { blogService } from '../services/blogService';
import { Button } from '../components/ui/button';
import DOMPurify from 'dompurify';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const posts = await blogService.getAll();
                const foundPost = posts.find(p => p.slug === slug);
                if (foundPost) {
                    setPost(foundPost);
                } else {
                    navigate('/blog');
                }
            } catch (error) {
                console.error('Failed to load blog post:', error);
                navigate('/blog');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [slug, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
        </div>
    );

    if (!post) return null;

    // HTML assaini avant injection — bloque tout script/handler stocké en base
    const createMarkup = () => {
        return { __html: DOMPurify.sanitize(post.content) };
    };

    const shareUrl = `https://www.yondly.app/blog/${post.slug}`;

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title={post.title}
                description={post.excerpt}
                keywords={post.keywords}
                url={`/blog/${post.slug}`}
                type="article"
                image={post.image}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": post.title,
                    "image": post.image,
                    "author": {
                        "@type": "Person",
                        "name": post.author
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "Yondly",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://www.yondly.app/logo192.png"
                        }
                    },
                    "datePublished": "2026-01-01", // Should be dynamic in real app
                    "description": post.excerpt
                }}
            />

            <Header />

            <article className="pt-32 pb-24">
                <div className="container-main max-w-4xl mx-auto">
                    {/* Breadcrumb / Back */}
                    <Link to="/blog" className="inline-flex items-center text-gray-500 hover:text-[var(--accent-primary)] mb-8 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au journal
                    </Link>

                    {/* Header */}
                    <div className="mb-10 text-center">
                        <div className="flex items-center justify-center gap-4 mb-6 text-sm text-[var(--text-secondary)]">
                            <span className="px-3 py-1 rounded-full bg-[var(--accent-wash)] text-[var(--accent-strong)] font-bold uppercase tracking-wide">
                                {post.category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {post.read_time || post.readTime}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold leading-tight text-[var(--text-primary)] mb-8">
                            {post.title}
                        </h1>

                        {/* Author */}
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <span className="font-bold text-gray-500">{post.author.charAt(0)}</span>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-sm">{post.author}</p>
                                <p className="text-xs text-gray-500">Rédacteu·rice Yondly</p>
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="w-full h-[300px] md:h-[500px] rounded-[2rem] mb-12 relative overflow-hidden shadow-xl shadow-green-900/5 group">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-body)] prose-a:text-[var(--accent-primary)] prose-strong:text-[var(--accent-strong)] mb-16">
                        <div dangerouslySetInnerHTML={createMarkup()} />
                    </div>

                    {/* Share & Tags */}
                    <div className="border-t border-b border-gray-100 py-8 mb-16 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 mr-2">Mots-clés :</span>
                            {post.keywords.split(', ').map(tag => (
                                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">#{tag}</span>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-900">Partager :</span>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 hover:text-blue-600">
                                <Facebook className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-sky-50 hover:text-sky-500">
                                <Twitter className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 hover:text-blue-700">
                                <Linkedin className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-[var(--surface-soft)] rounded-3xl p-8 md:p-12 text-center">
                        <h3 className="text-2xl font-bold mb-4">Cet article vous a plu ?</h3>
                        <p className="text-muted-foreground mb-8">
                            Rejoignez la communauté Yondly pour mettre ces conseils en pratique dès maintenant.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/beta">
                                <Button className="btn-primary px-8">Créer un compte</Button>
                            </Link>
                            <Link to="/blog">
                                <Button variant="outline" className="bg-white">Lire d'autres articles</Button>
                            </Link>
                        </div>
                    </div>

                </div>
            </article>

            <Footer />
        </div>
    );
};

export default BlogPost;
