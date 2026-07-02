import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cities } from '../../data/mock';
import { Loader2 } from 'lucide-react';

const API = '/mail.php';

const WaitlistForm = ({ compact = false, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    city: '',
    status: 'particulier',
    rgpdConsent: false,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('L\'email est requis');
      return;
    }

    if (!formData.rgpdConsent) {
      setError('Tu dois accepter la politique de confidentialité');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post(API, {
        type: 'waitlist',
        email: formData.email,
        city: formData.city || null,
        status: formData.status,
        comment: formData.comment || null,
        rgpd_consent: Boolean(formData.rgpdConsent),
      });

      // mail.php renvoie { success, message } — ne pas se fier au seul code HTTP.
      if (!res.data?.success) {
        setError(res.data?.message || 'Une erreur est survenue. Réessaie.');
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/merci');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Réessaie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="email"
              name="email"
              placeholder="Ton email"
              value={formData.email}
              onChange={handleChange}
              className="h-12 rounded-full px-5 border-[var(--border-light)] focus:border-[var(--accent-primary)] bg-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary h-12 px-6"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Rejoindre la bêta'
            )}
          </Button>
        </div>
        <div className="flex items-start gap-2 mt-3">
          <Checkbox
            id="rgpdConsent-compact"
            name="rgpdConsent"
            checked={formData.rgpdConsent}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, rgpdConsent: checked }))
            }
            className="mt-0.5"
          />
          <Label
            htmlFor="rgpdConsent-compact"
            className="text-xs text-[var(--text-muted)] leading-tight cursor-pointer"
          >
            J'accepte de recevoir des nouvelles de Yondly et la{' '}
            <a href="/confidentialite" className="underline hover:text-[var(--accent-strong)]">
              politique de confidentialité
            </a>
          </Label>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="ton@email.fr"
          value={formData.email}
          onChange={handleChange}
          className="h-12 rounded-xl px-4 border-[var(--border-light)] focus:border-[var(--accent-primary)]"
          required
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium">
          Ville <span className="text-[var(--text-muted)]">(optionnel)</span>
        </Label>
        <Select
          value={formData.city}
          onValueChange={(value) => handleSelectChange('city', value)}
        >
          <SelectTrigger className="h-12 rounded-xl px-4 border-[var(--border-light)]">
            <SelectValue placeholder="Sélectionne ta ville" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tu es...</Label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'particulier', label: 'Particulier' },
            { value: 'pro', label: 'Pro / Commerçant' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectChange('status', option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${formData.status === option.value
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-section)] text-[var(--text-body)] hover:bg-[rgba(143,236,120,0.2)]'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-medium">
          Un mot ? <span className="text-[var(--text-muted)]">(optionnel)</span>
        </Label>
        <textarea
          id="comment"
          name="comment"
          placeholder="Dis-nous ce qui t'intéresse..."
          value={formData.comment}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-xl px-4 py-3 border border-[var(--border-light)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none text-sm"
        />
      </div>

      {/* RGPD Consent */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="rgpdConsent"
          name="rgpdConsent"
          checked={formData.rgpdConsent}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, rgpdConsent: checked }))
          }
          className="mt-0.5"
        />
        <Label
          htmlFor="rgpdConsent"
          className="text-sm text-[var(--text-secondary)] leading-relaxed cursor-pointer"
        >
          J'accepte de recevoir des communications de Yondly et j'ai lu la{' '}
          <a href="/confidentialite" className="underline hover:text-[var(--accent-strong)]">
            politique de confidentialité
          </a>{' '}
          <span className="text-red-500">*</span>
        </Label>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full h-14 text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Inscription en cours...
          </>
        ) : (
          'Rejoindre la bêta'
        )}
      </Button>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Bêta sur iOS et Android • Quelques villes en priorité • Inscription gratuite
      </p>
    </form>
  );
};

export default WaitlistForm;
