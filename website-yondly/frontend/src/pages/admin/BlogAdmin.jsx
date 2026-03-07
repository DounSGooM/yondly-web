import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/blogService';
import { Button } from '../../components/ui/button';
import { Plus, Edit, Trash2, Loader2, Eye } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Toaster, toast } from 'sonner';

const BlogAdmin = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            const data = await blogService.getAll();
            setPosts(data);
        } catch (error) {
            toast.error("Erreur lors du chargement des articles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

        try {
            await blogService.delete(id);
            toast.success("Article supprimé");
            fetchPosts();
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />

            <main className="container-main pt-32 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="heading-2">Gestion du Blog</h1>
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
                        <div className="overflow-x-auto">
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
                                            <td className="p-4 text-sm text-gray-500">
                                                {post.date}
                                            </td>
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
                                                Aucun article pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default BlogAdmin;
