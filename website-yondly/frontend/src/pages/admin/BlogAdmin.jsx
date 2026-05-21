import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { Button } from '../../components/ui/button';
import { Plus, Edit, Trash2, Loader2, Eye, Sparkles, CheckCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Toaster, toast } from 'sonner';

const BlogAdmin = () => {
    const [posts, setPosts]       = useState([]);
    const [drafts, setDrafts]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [publishing, setPublishing] = useState(null); // id en cours de publication

    const fetchAll = async () => {
        try {
            const [published, draftList] = await Promise.all([
                blogService.getAll(),
                blogService.getDrafts(),
            ]);
            setPosts(published);
            setDrafts(draftList);
        } catch (error) {
            toast.error("Erreur lors du chargement des articles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer cet article définitivement ?")) return;
        try {
            await blogService.delete(id);
            toast.success("Article supprimé");
            fetchAll();
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handlePublish = async (id) => {
        setPublishing(id);
        try {
            await blogService.publish(id);
            toast.success("Article publié !");
            fetchAll();
        } catch {
            toast.error("Erreur lors de la publication");
        } finally {
            setPublishing(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />

            <main className="container-main pt-32 pb-20 space-y-10">

                {/* ── Brouillons IA ── */}
                {(loading || drafts.length > 0) && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h2 className="text-xl font-bold text-gray-800">
                                Brouillons générés par IA
                            </h2>
                            {drafts.length > 0 && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">
                                    {drafts.length} en attente
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Relisez et publiez les articles générés automatiquement.
                        </p>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
                                Aucun brouillon en attente.
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-amber-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-amber-50 border-b border-amber-100">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600">Article</th>
                                            <th className="p-4 font-semibold text-gray-600">Catégorie</th>
                                            <th className="p-4 font-semibold text-gray-600">Généré le</th>
                                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-50">
                                        {drafts.map((draft) => (
                                            <tr key={draft.id} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-900">{draft.title}</div>
                                                    <div className="text-sm text-gray-400">/{draft.slug}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                                        {draft.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">{draft.date}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link to={`/admin/blog/edit/${draft.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[var(--accent-primary)]">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            className="flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white text-xs px-3 h-8"
                                                            onClick={() => handlePublish(draft.id)}
                                                            disabled={publishing === draft.id}
                                                        >
                                                            {publishing === draft.id
                                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                : <CheckCircle className="w-3 h-3" />
                                                            }
                                                            Publier
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                                                            onClick={() => handleDelete(draft.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* ── Articles publiés ── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Articles publiés</h2>
                        <Link to="/admin/blog/new">
                            <Button className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Nouvel Article
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600">Article</th>
                                        <th className="p-4 font-semibold text-gray-600">Catégorie</th>
                                        <th className="p-4 font-semibold text-gray-600">Date</th>
                                        <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{post.title}</div>
                                                <div className="text-sm text-gray-500">/{post.slug}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    {post.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{post.date}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/blog/${post.slug}`} target="_blank">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link to={`/admin/blog/edit/${post.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[var(--accent-primary)]">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                                                        onClick={() => handleDelete(post.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {posts.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-500">
                                                Aucun article publié pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default BlogAdmin;
