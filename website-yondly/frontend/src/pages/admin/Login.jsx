import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Lock } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Toaster, toast } from 'sonner';

const Login = () => {
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple security: Store the key in localStorage.
        // The backend will validate it.
        localStorage.setItem('YONDLY_ADMIN_KEY', password);
        toast.success("Clé enregistrée !");
        navigate('/admin/blog');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Header />

            <main className="container-main pt-32 pb-20 flex justify-center items-center min-h-[60vh]">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-[var(--accent-wash)] rounded-full flex items-center justify-center text-[var(--accent-primary)]">
                            <Lock className="w-6 h-6" />
                        </div>
                    </div>

                    <h1 className="heading-3 text-center mb-2">Administration Blog</h1>
                    <p className="text-gray-500 text-center mb-8">Veuillez entrer votre clé d'accès.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••••••"
                            />
                        </div>

                        <Button type="submit" className="w-full btn-primary">
                            Accéder
                        </Button>
                    </form>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Login;
