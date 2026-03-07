import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Toaster, toast } from 'sonner';

const BlogEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image: '',
        category: '',
        author: '',
        read_time: '',
        date: '',
        keywords: ''
    });

    useEffect(() => {
        if (isEditing) {
            const fetchPost = async () => {
                try {
                    // Try to fetch from all posts since we don't have getById exposed singly nicely or just slug.
                    // Actually checking blogService I implemented getBySlug but not getById.
                    // Wait, routes.py has get /blog/{slug} but NO get /blog/id/{id}.
                    // Admin update uses ID. 
                    // I should probably fetch all and find by ID, or update service to fetch by ID if I had that endpoint?
                    // The backend `get_blog_posts` returns all. I can filter client side for now as list is small.
                    // Or I could use slug if I had it from params, but URL is /edit/:id.

                    // Let's fetch all and filter.
                    const posts = await blogService.getAll();
                    const post = posts.find(p => p.id === id);

                    if (post) {
                        setFormData({
                            title: post.title,
                            slug: post.slug,
                            excerpt: post.excerpt,
                            content: post.content,
                            image: post.image,
                            category: post.category,
                            author: post.author,
                            read_time: post.read_time, // Note snake_case from backend
                            date: post.date,
                            keywords: post.keywords
                        });
                    } else {
                        toast.error("Article non trouvé");
                        navigate('/admin/blog');
                    }
                } catch (error) {
                    toast.error("Erreur de chargement");
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [id, isEditing, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEditing) {
                await blogService.update(id, formData);
                toast.success("Article mis à jour");
            } else {
                await blogService.create(formData);
                toast.success("Article créé");
            }
            navigate('/admin/blog');
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'enregistrement. Vérifiez les champs (Slug unique ?)");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />

            <main className="container-main pt-32 pb-20">
                <Link to="/admin/blog" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la liste
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="heading-2">{isEditing ? 'Modifier l\'article' : 'Nouvel article'}</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Titre</Label>
                                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL unique)</Label>
                                <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} required placeholder="mon-super-article" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="Astuces, News..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">Auteur</Label>
                                <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Date d'affichage</Label>
                                <Input id="date" name="date" value={formData.date} onChange={handleChange} required placeholder="12 Oct 2025" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="read_time">Temps de lecture</Label>
                                <Input id="read_time" name="read_time" value={formData.read_time} onChange={handleChange} required placeholder="5 min" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keywords">Mots clés (séparés par virgule)</Label>
                                <Input id="keywords" name="keywords" value={formData.keywords} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">URL Image (Couverture)</Label>
                            <Input id="image" name="image" value={formData.image} onChange={handleChange} required placeholder="https://..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Extrait (Résumé court)</Label>
                            <Input id="excerpt" name="excerpt" value={formData.excerpt} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Contenu (HTML)</Label>
                            <p className="text-xs text-gray-500 mb-2">Vous pouvez écrire du HTML direct (ou p, h2, ul, li...)</p>
                            <textarea
                                id="content"
                                name="content"
                                rows={15}
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full rounded-xl border-gray-200 p-4 font-mono text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Enregistrer les modifications' : 'Publier l\'article'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogEditor;
