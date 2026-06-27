// Yondly Admin Dashboard - API Connected

const API_URL = '/api';

// State
let currentPage = 'overview';
let authToken = null;
let zones = [];

// EPCI Types
const EPCI_TYPES = {
    'agglomeration': "Communauté d'Agglomération (CA)",
    'communaute_communes': 'Communauté de Communes (CC)',
    'metropole': 'Métropole',
    'communaute_urbaine': 'Communauté Urbaine (CU)'
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
        authToken = savedToken;
        showDashboard();
    }

    // Events
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('menu-toggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('add-zone-form')?.addEventListener('submit', handleAddZone);

    document.querySelectorAll('.nav-link').forEach(link => {
        // Allow external links (like collectivites.html) to navigate normally
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('#')) {
            // Let the browser handle this link naturally
            return;
        }
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});

// Auth
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value.trim();
    const btn = e.target.querySelector('button');

    try {
        // Show loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (res.ok) {
            const data = await res.json();
            // Verify if user is actually admin
            const ADMIN_EMAILS = ['admin@yondly.com', 'lagaville.gerald@outlook.fr'];
            if (!ADMIN_EMAILS.includes(data.user.email)) {
                showToast('Accès non autorisé: Compte non admin', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            authToken = data.access_token;
            localStorage.setItem('admin_token', authToken);
            showDashboard();
            showToast('Bienvenue ! 🌱');
        } else {
            const error = await res.json();
            showToast(error.detail || 'Identifiants incorrects', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Erreur de connexion serveur', 'error');
    } finally {
        btn.innerHTML = `<span>Se connecter</span><i class="fas fa-arrow-right"></i>`;
        btn.disabled = false;
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('admin_token');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadDashboardData();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Navigation
function navigateTo(page) {
    currentPage = page;

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    const titles = {
        overview: 'Dashboard',
        zones: 'Gestion des Zones',
        users: 'Utilisateurs',
        pros: 'Commerces Pro',
        disputes: 'Gestion des Litiges',
        items: 'Annonces',
        impact: 'Impact Environnemental',
        'antigaspi': 'Qualité Anti-Gaspi',
        'territoire-graph': 'Intelligence territoriale',
        'safety-logs': 'Registre de Sécurité',
        'audit-logs': 'Audit Logs',
        'pro-verifications': 'Vérifications PRO',
        'pro-offers': 'Offres PRO',
        'pro-transparency': 'Transparence DSA',
        'dac7-exports': 'Exports DAC7',
        'associations': 'Associations / CCAS'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Hide all views
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.main-content').forEach(m => m.classList.add('hidden'));

    // Show target view
    const pageEl = document.getElementById(`page-${page}`);
    const viewEl = document.getElementById(`view-${page}`);

    if (pageEl) pageEl.classList.add('active');
    if (viewEl) viewEl.classList.remove('hidden');

    loadPageData(page);
}

// Data
async function loadDashboardData() {
    await loadStats();
    await loadZones();
    renderActiveZones();
    renderDashboardCharts();
    loadPageData(currentPage);
}

async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const stats = await res.json();
            updateStats(stats);
            return;
        }
    } catch (e) { }
    updateStats({ totalUsers: 0, totalPros: 0, totalItems: 0, totalCO2Kg: 0 });
}

function updateStats(s) {
    document.getElementById('total-users').textContent = s.totalUsers || 0;
    document.getElementById('total-pros').textContent = s.totalPros || 0;
    document.getElementById('total-items').textContent = s.totalItems || 0;
    document.getElementById('total-co2').textContent = formatCO2(s.totalCO2Kg || 0);
    document.getElementById('total-suspended').textContent = s.totalSuspended || 0;
}

function formatCO2(kg) {
    if (kg < 1) return `${Math.round(kg * 1000)}g`;
    if (kg < 1000) return `${kg.toFixed(1)}kg`;
    return `${(kg / 1000).toFixed(1)}t`;
}

function loadPageData(page) {
    switch (page) {
        case 'zones': renderZonesTable(); break;
        case 'users': loadUsers(); break;
        case 'pros': loadPros(); break;
        case 'disputes': loadDisputes(); break;
        case 'items': loadItems(); break;
        case 'impact': loadImpact(); break;
        case 'antigaspi': loadAntigaspi(); break;
        case 'territoire-graph': loadTerritoireGraph(); break;
        case 'safety-logs': loadSafetyLogs(); break;
        case 'pro-verifications': loadProVerifications(); break;
        case 'pro-offers': loadProOffers(); break;
        case 'pro-transparency': loadTransparency(); break;
        case 'dac7-exports': loadDac7Jobs(); break;
        // New Email Collection Pages
        case 'waitlist': loadWaitlist(); break;
        case 'contact-messages': loadContacts(); break;
        case 'partners': loadPartners(); break;
        case 'associations': loadAssociations(); break;
    }
}

// ============ EMAIL COLLECTION LOADERS ============

function showDetailModal(title, data) {
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = title;

    // Format JSON data nicely
    let content = '<div class="detail-grid">';
    for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'rgpd_consent') continue;
        content += `<div class="detail-item">
            <span class="detail-label">${key}</span>
            <span class="detail-value">${value || '-'}</span>
        </div>`;
    }
    content += '</div>';

    modalBody.innerHTML = content;
    modal.classList.remove('hidden');
}

async function loadWaitlist() {
    const tbody = document.getElementById('waitlist-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chargement...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/waitlist`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucune inscription</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(i => {
                const rowData = JSON.stringify(i).replace(/"/g, '&quot;');
                return `
                <tr onclick="showDetailModal('Détail Inscription', ${rowData})" style="cursor: pointer;">
                    <td><strong>${i.email}</strong></td>
                    <td>${i.city || '-'}</td>
                    <td><span class="badge-status ${i.status === 'pro' ? 'badge-active' : 'badge-inactive'}">${i.status}</span></td>
                    <td>${i.comment || '-'}</td>
                    <td>${new Date(i.created_at).toLocaleString('fr-FR')}</td>
                </tr>
            `}).join('');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erreur API</td></tr>';
    }
}

async function loadContacts() {
    const tbody = document.getElementById('contacts-table-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chargement...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/contacts`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucun message</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(i => {
                const rowData = JSON.stringify(i).replace(/"/g, '&quot;');
                return `
                <tr onclick="showDetailModal('Message Contact', ${rowData})" style="cursor: pointer;">
                    <td><strong>${i.name}</strong></td>
                    <td>${i.email}</td>
                    <td>${i.subject || '-'}</td>
                    <td><div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.message}</div></td>
                    <td>${new Date(i.created_at).toLocaleString('fr-FR')}</td>
                </tr>
            `}).join('');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erreur API</td></tr>';
    }
}

async function loadPartners() {
    const tbody = document.getElementById('partners-table-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chargement...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/partners`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucune candidature</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(i => {
                const rowData = JSON.stringify(i).replace(/"/g, '&quot;');
                return `
                <tr onclick="showDetailModal('Candidature Partenaire', ${rowData})" style="cursor: pointer;">
                    <td><strong>${i.name}</strong></td>
                    <td>${i.business}</td>
                    <td>${i.city || '-'}</td>
                    <td>
                        <div>${i.email}</div>
                        <small>${i.phone || ''}</small>
                    </td>
                    <td><div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.message || '-'}</div></td>
                    <td>${new Date(i.created_at).toLocaleString('fr-FR')}</td>
                </tr>
            `}).join('');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erreur API</td></tr>';
    }
}

// ============ ASSOCIATIONS / CCAS ============

async function loadAssociations() {
    const tbody = document.getElementById('associations-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chargement...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/associations`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucune association inscrite</td></tr>';
                return;
            }
            tbody.innerHTML = data.map(a => `
                <tr>
                    <td><strong>${a.association_name || a.display_name}</strong></td>
                    <td>${a.email}</td>
                    <td>${a.city || '-'}</td>
                    <td>
                        ${a.association_verified
                    ? '<span class="badge badge-success">Vérifiée</span>'
                    : '<span class="badge badge-warning">En attente</span>'
                }
                    </td>
                    <td>
                        ${a.association_verified
                    ? `<button class="btn btn-sm btn-danger" onclick="unverifyAssociation('${a.id}')">Révoquer</button>`
                    : `<button class="btn btn-sm btn-success" onclick="verifyAssociation('${a.id}')">Vérifier</button>`
                }
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error('Error loading associations:', e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erreur API</td></tr>';
    }
}

async function verifyAssociation(userId) {
    if (!confirm('Vérifier cette association ?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/associations/${userId}/verify`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            alert('Association vérifiée avec succès');
            loadAssociations();
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.detail || 'Impossible de vérifier'));
        }
    } catch (e) {
        alert('Erreur réseau');
    }
}

async function unverifyAssociation(userId) {
    if (!confirm('Révoquer la vérification de cette association ?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/associations/${userId}/unverify`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            alert('Vérification révoquée');
            loadAssociations();
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.detail || 'Impossible de révoquer'));
        }
    } catch (e) {
        alert('Erreur réseau');
    }
}

// ============ ZONES (API Connected) ============

async function loadZones() {
    try {
        const res = await fetch(`${API_URL}/zones`);
        if (res.ok) {
            zones = await res.json();
        }
    } catch (e) {
        console.error('Failed to load zones:', e);
        zones = [];
    }
}

function renderActiveZones() {
    const el = document.getElementById('active-zones-list');
    if (!el) return;

    el.innerHTML = zones.map(z => `
        <div class="zone-chip ${z.isActive ? 'active' : ''}">
            <span class="zone-dot"></span>
            <span>${z.displayName}</span>
        </div>
    `).join('');
}

function renderZonesTable() {
    const tbody = document.getElementById('zones-table-body');
    if (!tbody) return;

    if (zones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Aucune zone. Cliquez sur "Ajouter une zone" pour commencer.</td></tr>';
        return;
    }

    tbody.innerHTML = zones.map(z => {
        const activeCommunes = z.communes?.filter(c => c.isActive).length || 0;
        const totalCommunes = z.communes?.length || 0;
        return `
        <tr class="clickable-row" onclick="showZoneDetails('${z.id}')">
            <td>
                <strong>${z.displayName}</strong>
                <br><small style="color: var(--text-muted)">${EPCI_TYPES[z.type] || z.type}</small>
            </td>
            <td>${activeCommunes} / ${totalCommunes} communes</td>
            <td><span class="badge-status ${z.isActive ? 'badge-active' : 'badge-inactive'}">${z.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-sm btn-toggle ${z.isActive ? '' : 'off'}" onclick="event.stopPropagation(); toggleZoneAPI('${z.id}', ${!z.isActive})">
                    ${z.isActive ? 'Désactiver' : 'Activer'}
                </button>
            </td>
        </tr>
    `}).join('');
}

function showZoneDetails(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    const activeCommunes = zone.communes?.filter(c => c.isActive).length || 0;
    const totalPop = zone.communes?.reduce((sum, c) => sum + (c.population || 0), 0) || 0;

    const modal = document.getElementById('zone-detail-modal');
    if (!modal) {
        const modalHtml = `
            <div id="zone-detail-modal" class="modal">
                <div class="modal-overlay" onclick="closeZoneDetailModal()"></div>
                <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                    <div class="modal-header">
                        <h2 id="zone-detail-title"></h2>
                        <button class="btn-icon" onclick="closeZoneDetailModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="zone-detail-content" style="overflow-y: auto; flex: 1;"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    document.getElementById('zone-detail-title').textContent = zone.displayName;
    document.getElementById('zone-detail-content').innerHTML = `
        <div class="zone-stats-row">
            <div class="zone-stat">
                <span class="zone-stat-value">${zone.communes?.length || 0}</span>
                <span class="zone-stat-label">Communes</span>
            </div>
            <div class="zone-stat">
                <span class="zone-stat-value">${activeCommunes}</span>
                <span class="zone-stat-label">Actives</span>
            </div>
            <div class="zone-stat">
                <span class="zone-stat-value">${(totalPop / 1000).toFixed(0)}k</span>
                <span class="zone-stat-label">Population</span>
            </div>
        </div>
        
        <table class="table communes-table">
            <thead>
                <tr>
                    <th>Commune</th>
                    <th>Population</th>
                    <th>Statut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${zone.communes?.map(c => `
                    <tr>
                        <td><strong>${c.name}</strong></td>
                        <td>${(c.population || 0).toLocaleString()}</td>
                        <td><span class="badge-status ${c.isActive ? 'badge-active' : 'badge-inactive'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <button class="btn-sm btn-toggle ${c.isActive ? '' : 'off'}" onclick="toggleCommuneAPI('${zoneId}', '${c.name}', ${!c.isActive})">
                                ${c.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Aucune commune</td></tr>'}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
            <button class="btn-sm" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;" onclick="deleteZoneAPI('${zoneId}')">
                <i class="fas fa-trash"></i> Supprimer cette zone
            </button>
        </div>
    `;

    document.getElementById('zone-detail-modal').classList.remove('hidden');
}

function closeZoneDetailModal() {
    const modal = document.getElementById('zone-detail-modal');
    if (modal) modal.classList.add('hidden');
}

// API Calls for Zones
async function toggleZoneAPI(zoneId, newStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/zones/${zoneId}/toggle`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ isActive: newStatus })
        });
        if (res.ok) {
            await loadZones();
            renderZonesTable();
            renderActiveZones();
            showToast(`Zone ${newStatus ? 'activée' : 'désactivée'}`);
        } else {
            showToast('Erreur lors de la mise à jour', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

async function toggleCommuneAPI(zoneId, communeName, newStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/zones/${zoneId}/communes/${encodeURIComponent(communeName)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ isActive: newStatus })
        });
        if (res.ok) {
            await loadZones();
            showZoneDetails(zoneId); // Refresh modal
            renderActiveZones();
            showToast(`${communeName} ${newStatus ? 'activée' : 'désactivée'}`);
        } else {
            showToast('Erreur lors de la mise à jour', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

async function deleteZoneAPI(zoneId) {
    if (!confirm('Supprimer cette zone ?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/zones/${zoneId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            await loadZones();
            closeZoneDetailModal();
            renderZonesTable();
            renderActiveZones();
            showToast('Zone supprimée');
        } else {
            showToast('Erreur lors de la suppression', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

function showAddZoneModal() {
    document.getElementById('add-zone-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('add-zone-modal').classList.add('hidden');
}

async function handleAddZone(e) {
    e.preventDefault();
    const name = document.getElementById('zone-name').value;
    const type = document.getElementById('zone-type')?.value || 'agglomeration';

    try {
        const res = await fetch(`${API_URL}/admin/zones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
                name: name,
                displayName: name,
                type: type,
                isActive: true,
                communes: []
            })
        });
        if (res.ok) {
            await loadZones();
            closeModal();
            renderZonesTable();
            renderActiveZones();
            showToast(`Zone "${name}" créée`);
            e.target.reset();
        } else {
            showToast('Erreur lors de la création', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

// ============ EPCI SEARCH (Auto-fetch communes from geo.api.gouv.fr) ============

let searchTimeout = null;
let selectedEpci = null;

async function searchEPCI(query) {
    console.log('searchEPCI called with:', query);

    if (query.length < 2) {
        document.getElementById('epci-results').innerHTML = '';
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        console.log('Fetching EPCI for:', query);
        try {
            const res = await fetch(`${API_URL}/admin/search-epci?q=${encodeURIComponent(query)}`);
            console.log('Search response:', res.status);
            if (res.ok) {
                const results = await res.json();
                console.log('Search results:', results);
                renderEPCIResults(results);
            } else {
                console.error('Search failed:', res.status, await res.text());
            }
        } catch (e) {
            console.error('EPCI search error:', e);
        }
    }, 300);
}

function renderEPCIResults(results) {
    const container = document.getElementById('epci-results');
    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 10px; color: #888; font-size: 13px;">Aucun résultat</div>';
        return;
    }

    // Group by type
    const epcis = results.filter(r => r.type === 'epci');
    const communes = results.filter(r => r.type === 'commune');

    container.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; right: 0; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; max-height: 300px; overflow-y: auto;">
            ${epcis.length > 0 ? `
                <div style="padding: 8px 16px; background: #f8fafc; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                    🏛️ INTERCOMMUNALITÉS (EPCI)
                </div>
                ${epcis.map(r => `
                    <div onclick="selectEPCI('${r.code}', '${r.name.replace(/'/g, "\\'")}', ${r.population})" 
                         style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.15s;"
                         onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='white'">
                        <div style="font-weight: 600; color: #166534;">${r.label}</div>
                        <div style="font-size: 12px; color: #888;">${r.sublabel}</div>
                    </div>
                `).join('')}
            ` : ''}
            
            ${communes.length > 0 ? `
                <div style="padding: 8px 16px; background: #f8fafc; font-size: 11px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">
                    📍 COMMUNES
                </div>
                ${communes.map(r => `
                    <div onclick="selectCommune('${r.code}', '${r.name.replace(/'/g, "\\'")}', '${r.epci_code || ''}')" 
                         style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.15s;"
                         onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='white'">
                        <div style="font-weight: 600; color: #1d4ed8;">${r.label}</div>
                        <div style="font-size: 12px; color: #888;">${r.sublabel}</div>
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `;
}

// Select a commune and auto-fetch its EPCI
async function selectCommune(communeCode, communeName, epciCode) {
    if (!epciCode) {
        showToast("Cette commune n'appartient pas à un EPCI", 'error');
        return;
    }

    document.getElementById('epci-results').innerHTML = '<div style="padding: 12px; text-align: center;"><i class="fas fa-spinner fa-spin"></i> Recherche de EPCI...</div>';

    try {
        // Fetch EPCI info
        const res = await fetch(`https://geo.api.gouv.fr/epcis/${epciCode}?fields=nom,code,population`);
        if (res.ok) {
            const epci = await res.json();
            selectEPCI(epci.code, epci.nom, epci.population);
        } else {
            showToast('EPCI non trouvé', 'error');
            document.getElementById('epci-results').innerHTML = '';
        }
    } catch (e) {
        console.error('Failed to fetch EPCI:', e);
        showToast("Erreur lors de la récupération de l'EPCI", 'error');
        document.getElementById('epci-results').innerHTML = '';
    }
}

async function selectEPCI(code, name, population) {
    selectedEpci = { code, name, population };

    document.getElementById('epci-results').innerHTML = '';
    document.getElementById('epci-search').value = name;
    document.getElementById('selected-epci-code').value = code;
    document.getElementById('selected-epci-name').value = name;

    // Fetch communes count
    try {
        const res = await fetch(`${API_URL}/admin/epci/${code}/communes`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const communes = await res.json();
            selectedEpci.communesCount = communes.length;

            // Show preview
            document.getElementById('epci-preview').style.display = 'block';
            document.getElementById('preview-name').textContent = name;
            document.getElementById('preview-pop').textContent = `${(population || 0).toLocaleString()} habitants`;
            document.getElementById('preview-communes').textContent = `${communes.length} communes`;

            // Enable button
            document.getElementById('create-zone-btn').disabled = false;
        }
    } catch (e) {
        console.error('Failed to fetch communes:', e);
    }
}

async function handleAddZoneFromEPCI(e) {
    e.preventDefault();
    console.log('handleAddZoneFromEPCI called');

    const epciCode = document.getElementById('selected-epci-code').value;

    console.log('EPCI Code:', epciCode);

    if (!epciCode) {
        showToast('Veuillez sélectionner un EPCI', 'error');
        return;
    }

    const btn = document.getElementById('create-zone-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création en cours...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/admin/zones/create-from-epci`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({
                epci_code: epciCode
            })
        });

        if (res.ok) {
            const data = await res.json();
            await loadZones();
            closeModal();
            renderZonesTable();
            renderActiveZones();
            showToast(`✅ Zone "${data.zone.displayName}" créée avec ${data.communes_count} communes !`);

            // Reset form
            document.getElementById('epci-search').value = '';
            document.getElementById('selected-epci-code').value = '';
            document.getElementById('epci-preview').style.display = 'none';
            selectedEpci = null;
        } else {
            const error = await res.json();
            showToast(error.detail || 'Erreur lors de la création', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    } finally {
        btn.innerHTML = '<i class="fas fa-magic"></i> Créer avec communes';
        btn.disabled = false;
    }
}

// Users
async function editUserLevel(userId, currentLevel) {
    event.stopPropagation(); // Prevent row click if any
    const newLevel = prompt("Nouveau niveau (Graine, Pousse, Arbre, Forêt) :", currentLevel);
    if (!newLevel || newLevel === currentLevel) return;

    const validLevels = ["Graine", "Pousse", "Arbre", "Forêt"];
    // Capitalize first letter
    const formattedLevel = newLevel.charAt(0).toUpperCase() + newLevel.slice(1).toLowerCase();

    if (!validLevels.includes(formattedLevel)) {
        alert("Niveau invalide. Choix possibles : " + validLevels.join(", "));
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}/level`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ level: formattedLevel })
        });

        if (res.ok) {
            alert("Niveau mis à jour !");
            loadUsers(); // Refresh list
        } else {
            const err = await res.json();
            alert("Erreur : " + (err.detail || "Impossible de mettre à jour"));
        }
    } catch (e) {
        alert("Erreur réseau");
    }
}

async function editUserLevel(userId, currentLevel) {
    event.stopPropagation(); // Prevent row click if any
    const newLevel = prompt("Nouveau niveau (Graine, Pousse, Arbre, Forêt) :", currentLevel);
    if (!newLevel || newLevel === currentLevel) return;

    const validLevels = ["Graine", "Pousse", "Arbre", "Forêt"];
    // Capitalize first letter
    const formattedLevel = newLevel.charAt(0).toUpperCase() + newLevel.slice(1).toLowerCase();

    if (!validLevels.includes(formattedLevel)) {
        alert("Niveau invalide. Choix possibles : " + validLevels.join(", "));
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}/level`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ level: formattedLevel })
        });

        if (res.ok) {
            alert("Niveau mis à jour !");
            loadUsers(); // Refresh list
        } else {
            const err = await res.json();
            alert("Erreur : " + (err.detail || "Impossible de mettre à jour"));
        }
    } catch (e) {
        alert("Erreur réseau");
    }
}

async function loadUsers() {
    let users = [];
    try {
        const res = await fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.ok) {
            users = await res.json();
        } else {
            console.error("Failed to load users:", res.status, res.statusText);
            if (res.status === 401) showToast("Session expirée, veuillez vous reconnecter", "error");
        }
    } catch (e) {
        console.error("Network error loading users:", e);
        showToast("Erreur réseau (utilisateurs)", "error");
    }

    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Aucun utilisateur</td></tr>';
        return;
    }

    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = users.map(u => {
        const riskColor = u.risk_score > 50 ? '#ef4444' : (u.risk_score > 20 ? '#f59e0b' : '#10b981');
        return `
        <tr>
            <td>
                <strong>${u.display_name}</strong>
                ${u.verified ? '<i class="fas fa-check-circle" style="color:#10b981;font-size:12px;" title="Vérifié"></i>' : ''}
            </td>
            <td style="color: var(--text-secondary)">${u.email}</td>
             <td>
                <select 
                    onchange="updateUserLevel(this, '${u.id}')" 
                    data-original="${u.level || 'Graine'}"
                    onclick="event.stopPropagation()"
                    style="padding: 4px 8px; border-radius: 6px; border: 1px solid #ddd; background: white; font-size: 13px;"
                >
                    <option value="Graine" ${(!u.level || u.level === 'Graine') ? 'selected' : ''}>🌱 Graine</option>
                    <option value="Pousse" ${u.level === 'Pousse' ? 'selected' : ''}>🌿 Pousse</option>
                    <option value="Arbre" ${u.level === 'Arbre' ? 'selected' : ''}>🌳 Arbre</option>
                    <option value="Forêt" ${u.level === 'Forêt' ? 'selected' : ''}>🌲 Forêt</option>
                </select>
            </td>
            <td>
                <span class="badge-status badge-active" style="background:${riskColor}20; color:${riskColor};">
                    ${u.trust_level} (Risk: ${u.risk_score})
                </span>
            </td>
            <td>${formatCO2(u.co2_saved || 0)}</td>
            <td>
                <button type="button" class="btn-sm btn-secondary" onclick="editUserTrust('${u.id}', '${u.trust_level}')">
                    <i class="fas fa-shield-alt"></i> Trust
                </button>
                <button type="button" class="btn-sm" style="background-color: #ff4444; color: white; margin-left: 5px;" onclick="deleteUser('${u.id}', event)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

async function editUserTrust(userId, currentLevel) {
    const newLevel = prompt(`Niveau de confiance actuel: ${currentLevel}\nNouveau niveau (new, verified, restricted, banned):`, currentLevel);
    if (!newLevel || newLevel === currentLevel) return;

    if (!['new', 'verified', 'restricted', 'banned'].includes(newLevel)) {
        alert('Niveau invalide. Utilisez: new, verified, restricted, banned');
        return;
    }

    const reason = prompt("Raison du changement (pour les logs):", "Révision manuelle admin");

    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}/trust`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ trust_level: newLevel, manual_adjustment_reason: reason || "Manuelle" })
        });

        if (res.ok) {
            showToast('Niveau de confiance mis à jour');
            loadUsers();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    } catch (e) {
        alert('Erreur réseau');
    }
}

// ============ SAFETY LOGS ============

async function loadSafetyLogs() {
    const tbody = document.getElementById('safety-logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/safety-events`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (res.ok) {
            const events = await res.json();
            if (events.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucun événement de sécurité</td></tr>';
                return;
            }

            console.log("Events received:", events);
            tbody.innerHTML = events.map(e => `
                <tr>
                    <td>${new Date(e.created_at).toLocaleString()}</td>
                    <td><span style="font-weight:600;">${e.event_type}</span></td>
                    <td>
                        <span class="badge-status" style="
                            background: ${e.severity === 'high' ? '#fee2e2' : (e.severity === 'medium' ? '#fef3c7' : '#e0f2f1')};
                            color: ${e.severity === 'high' ? '#b91c1c' : (e.severity === 'medium' ? '#92400e' : '#047857')};
                        ">
                            ${e.severity}
                        </span>
                    </td>
                    <td>${e.metadata?.message || e.metadata?.original_text || e.metadata?.reason || '-'}</td>
                    <td><code style="font-size:11px;">${e.metadata ? Object.keys(e.metadata).filter(k => k !== 'message' && k !== 'original_text').map(k => k + ':' + e.metadata[k]).join(', ') : ''}</code></td>
                </tr>
            `).join('');
        } else {
            console.error("Fetch failed:", res.status, res.statusText);
            const errText = await res.text();
            console.error("Error response:", errText);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur API: ${res.status} (${res.statusText})</td></tr>`;
        }
    } catch (e) {
        console.error("Error loading safety logs:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Erreur JS: ${e.message}</td></tr>`;
    }
}

// ─── Qualité Anti-Gaspi ──────────────────────────────────────────────────────
const ANTIGASPI_REASONS = {
    not_consumable: 'Non consommable',
    expired: 'Périmé',
    cold_or_spoiled: 'Froid / avarié',
    far_from_description: 'Non conforme description',
    too_old: 'Trop vieux',
    quantity_short: 'Quantité insuffisante',
    other: 'Autre',
};

function antigaspiStatusBadge(status) {
    const map = {
        OK: ['#e0f2f1', '#047857', 'OK'],
        WATCH: ['#fef3c7', '#92400e', 'SURVEILLANCE'],
        SUSPENDED: ['#fee2e2', '#b91c1c', 'SUSPENDU'],
        open: ['#fef3c7', '#92400e', 'À traiter'],
        reviewing: ['#e0e7ff', '#3730a3', 'En cours'],
        refunded: ['#dcfce7', '#166534', 'Remboursé'],
        rejected: ['#f3f4f6', '#6b7280', 'Rejeté'],
    };
    const [bg, color, label] = map[status] || ['#f3f4f6', '#6b7280', status || '-'];
    return `<span class="badge-status" style="background:${bg};color:${color};">${label}</span>`;
}

async function loadAntigaspi() {
    const flaggedBody = document.getElementById('antigaspi-flagged-body');
    const reportsBody = document.getElementById('antigaspi-reports-body');
    if (!flaggedBody || !reportsBody) return;

    flaggedBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';
    reportsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';

    // 1. Commerçants sous surveillance
    try {
        const res = await fetch(`${API_URL}/admin/antigaspi/flagged`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const stores = res.ok ? await res.json() : [];
        if (!stores.length) {
            flaggedBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun commerçant à surveiller 🎉</td></tr>';
        } else {
            flaggedBody.innerHTML = stores.map(s => `
                <tr>
                    <td style="font-weight:600;">${s.name || '-'}</td>
                    <td>${antigaspiStatusBadge(s.quality_status)}</td>
                    <td>${s.conformity_rate != null ? Math.round(s.conformity_rate) + '%' : '—'}</td>
                    <td>${s.basket_reviews_count || 0}</td>
                    <td>${s.reports_count || 0} (${s.reports_open_count || 0} ouverts)</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        flaggedBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Erreur: ${e.message}</td></tr>`;
    }

    // 2. Signalements
    try {
        const filter = document.getElementById('antigaspi-report-filter')?.value ?? 'open';
        const url = filter
            ? `${API_URL}/admin/antigaspi/reports?status=${filter}`
            : `${API_URL}/admin/antigaspi/reports`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
        const reports = res.ok ? await res.json() : [];
        if (!reports.length) {
            reportsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Aucun signalement</td></tr>';
        } else {
            reportsBody.innerHTML = reports.map(r => `
                <tr>
                    <td>${new Date(r.created_at).toLocaleString()}</td>
                    <td>${r.store_name || '-'}</td>
                    <td>${r.deal_title || '-'}</td>
                    <td>${ANTIGASPI_REASONS[r.reason] || r.reason}${r.description ? `<br><small style="color:#6b7280;">${r.description}</small>` : ''}</td>
                    <td>${antigaspiStatusBadge(r.status)}</td>
                    <td>
                        ${r.status === 'open' ? `
                            <button class="btn-sm btn-primary" onclick="resolveBasketReport('${r.id}', 'refunded')">Rembourser</button>
                            <button class="btn-sm btn-secondary" onclick="resolveBasketReport('${r.id}', 'rejected')">Rejeter</button>
                        ` : (r.credit_cents ? `${(r.credit_cents / 100).toFixed(2)}€ crédité` : '—')}
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) {
        reportsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Erreur: ${e.message}</td></tr>`;
    }
}

async function resolveBasketReport(reportId, resolution) {
    let creditCents = 0;
    if (resolution === 'refunded') {
        const euros = prompt('Montant du crédit Yondly à accorder (€) :', '5');
        if (euros === null) return;
        creditCents = Math.round(parseFloat(euros.replace(',', '.')) * 100) || 0;
    } else {
        if (!confirm('Rejeter ce signalement ?')) return;
    }
    try {
        const res = await fetch(`${API_URL}/admin/baskets/reports/${reportId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ resolution, credit_cents: creditCents })
        });
        if (res.ok) {
            showToast(resolution === 'refunded' ? 'Acheteur remboursé en crédit Yondly' : 'Signalement rejeté');
            loadAntigaspi();
        } else {
            const err = await res.json();
            showToast(err.detail || 'Erreur', 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

// ─── Intelligence territoriale (Knowledge Graph) ─────────────────────────────
let _tgRecos = [];

async function loadTerritoireGraph() {
    const period = document.getElementById('tg-period')?.value || '90j';
    const summary = document.getElementById('tg-summary');
    if (!summary) return;
    summary.innerHTML = '<div style="padding:20px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const res = await fetch(`${API_URL}/territoire/graph?period=${period}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const d = await res.json();
        const s = d.summary || {};

        summary.innerHTML = [
            ['Catégories', s.categories], ['Communes', s.zones], ['Repreneurs', s.partners],
            ['Annonces actives', s.active_items], ['Échanges', s.transactions],
        ].map(([l, v]) =>
            `<div class="stat-card"><div class="stat-value">${v || 0}</div><div class="stat-label">${l}</div></div>`
        ).join('');

        const ins = d.insights || {};
        _tgRecos = ins.recommendations || [];

        document.getElementById('tg-recos').innerHTML = _tgRecos.length ? _tgRecos.map(r => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f0f0f0;">
                <span class="badge-status" style="background:#e8f5ec;color:#2d7d46;white-space:nowrap;">${r.action}</span>
                <div><strong>${r.category}</strong>
                    <div style="color:#666;font-size:13px;margin-top:2px;">${r.reason}</div>
                </div>
            </div>`).join('') : '<p style="color:#888;">Pas encore assez de données pour générer des recommandations.</p>';

        const cats = (d.nodes && d.nodes.categories) || [];
        document.getElementById('tg-ovd-body').innerHTML = cats.length ? cats.map(c => {
            const gap = (c.demand || 0) - (c.supply || 0);
            let signal = '—';
            if (gap > 0) signal = '<span style="color:#b3261e;font-weight:600;">Demande forte</span>';
            else if ((c.supply || 0) >= 3 && (c.demand || 0) === 0) signal = '<span style="color:#9a5b00;font-weight:600;">Surstock</span>';
            return `<tr><td>${c.name}</td><td>${c.supply || 0}</td><td>${c.demand || 0}</td><td>${gap > 0 ? '+' : ''}${gap}</td><td>${signal}</td></tr>`;
        }).join('') : '<tr><td colspan="5" style="text-align:center;">—</td></tr>';

        document.getElementById('tg-surplus-body').innerHTML = (ins.surplus_risk || []).length
            ? ins.surplus_risk.map(x => `<tr><td>${x.category}</td><td>${x.supply}</td></tr>`).join('')
            : '<tr><td colspan="2" style="text-align:center;">Aucun</td></tr>';

        document.getElementById('tg-zones-body').innerHTML = (ins.underserved_zones || []).length
            ? ins.underserved_zones.map(x => `<tr><td>${x.commune}</td><td>${x.supply}</td></tr>`).join('')
            : '<tr><td colspan="2" style="text-align:center;">Aucune</td></tr>';

        document.getElementById('tg-trend-body').innerHTML = (ins.trending || []).length
            ? ins.trending.map(x => {
                const up = x.trend_pct >= 0;
                return `<tr><td>${x.category}</td><td>${x.demand}</td><td>${x.prev}</td><td style="color:${up ? '#047857' : '#b91c1c'};font-weight:600;">${up ? '+' : ''}${x.trend_pct}%</td></tr>`;
            }).join('')
            : '<tr><td colspan="4" style="text-align:center;">—</td></tr>';
    } catch (e) {
        summary.innerHTML = `<div style="color:red;padding:20px;">Erreur: ${e.message}</div>`;
    }
}

function copyTerritoireRecos() {
    if (!_tgRecos.length) { showToast('Aucune recommandation à copier', 'error'); return; }
    const text = _tgRecos.map(r => `• ${r.category} — ${r.action} : ${r.reason}`).join('\n');
    navigator.clipboard.writeText(text).then(
        () => showToast('Recommandations copiées'),
        () => showToast('Copie impossible', 'error')
    );
}

// Pros (DSA Compliant)
let currentProFilter = 'all';

async function loadPros() {
    let pros = [];
    try {
        // Use new DSA-compliant endpoint
        const url = currentProFilter === 'all'
            ? `${API_URL}/admin/pro-sellers`
            : `${API_URL}/admin/pro-sellers?status=${currentProFilter}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.ok) pros = await res.json();
    } catch (e) {
        console.error('Failed to load pro sellers:', e);
    }

    // Render filter tabs
    const filterHtml = `
        <div class="pro-filters" style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="filter-btn ${currentProFilter === 'all' ? 'active' : ''}" onclick="filterPros('all')">
                Tous (${pros.length})
            </button>
            <button class="filter-btn ${currentProFilter === 'pending' ? 'active' : ''}" onclick="filterPros('pending')" style="border-color: #f59e0b;">
                ⏳ En attente
            </button>
            <button class="filter-btn ${currentProFilter === 'verified' ? 'active' : ''}" onclick="filterPros('verified')" style="border-color: #10b981;">
                ✅ Vérifiés
            </button>
            <button class="filter-btn ${currentProFilter === 'rejected' ? 'active' : ''}" onclick="filterPros('rejected')" style="border-color: #ef4444;">
                ❌ Rejetés
            </button>
            <button class="filter-btn ${currentProFilter === 'suspended' ? 'active' : ''}" onclick="filterPros('suspended')" style="border-color: #6b7280;">
                🚫 Suspendus
            </button>
        </div>
    `;

    const tbody = document.getElementById('pros-table-body');
    const tableContainer = tbody.closest('.card');

    // Add filters before table if not already there
    if (!document.querySelector('.pro-filters')) {
        tableContainer.insertAdjacentHTML('afterbegin', filterHtml);
    } else {
        document.querySelector('.pro-filters').outerHTML = filterHtml;
    }

    if (!pros.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">
            Aucun professionnel ${currentProFilter !== 'all' ? 'avec ce statut' : 'inscrit'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = pros.map(p => {
        const statusBadges = {
            'pending': '<span class="badge-status" style="background: #fef3c7; color: #92400e;">⏳ En attente</span>',
            'verified': '<span class="badge-status badge-active">✅ Vérifié</span>',
            'rejected': '<span class="badge-status" style="background: #fee2e2; color: #991b1b;">❌ Rejeté</span>',
            'suspended': '<span class="badge-status" style="background: #f3f4f6; color: #6b7280;">🚫 Suspendu</span>'
        };
        const badge = statusBadges[p.status] || statusBadges['pending'];

        return `
        <tr class="clickable-row" onclick="showProDSADetails('${p.id}')">
            <td>
                <strong>${p.business_name || p.user?.display_name || 'N/A'}</strong>
                <div style="font-size: 11px; color: #888;">${p.trade_name || ''}</div>
            </td>
            <td style="font-family: monospace; font-size: 12px;">${p.siren ? p.siren.replace(/(\d{3})(?=\d)/g, '$1 ') : 'N/A'}</td>
            <td>${p.city || 'N/A'}</td>
            <td>${badge}</td>
            <td style="font-size: 12px; color: #888;">${new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
            <td>
                ${p.status === 'pending' ? `
                    <button type="button" class="btn-sm" style="background: #10b981; color: white;" onclick="event.stopPropagation(); verifyPro('${p.id}', 'verify')">Vérifier</button>
                    <button type="button" class="btn-sm" style="background: #ef4444; color: white; margin-left: 4px;" onclick="event.stopPropagation(); verifyPro('${p.id}', 'reject')">Rejeter</button>
                ` : ''}
                ${p.status === 'verified' ? `
                    <button type="button" class="btn-sm" style="background: #6b7280; color: white;" onclick="event.stopPropagation(); verifyPro('${p.id}', 'suspend')">Suspendre</button>
                ` : ''}
                ${p.status === 'suspended' ? `
                    <button type="button" class="btn-sm" style="background: #10b981; color: white;" onclick="event.stopPropagation(); verifyPro('${p.id}', 'reactivate')">Réactiver</button>
                ` : ''}
                <button type="button" class="btn-sm btn-secondary" style="margin-left: 4px;" onclick="event.stopPropagation(); showProDSADetails('${p.id}')">Détails</button>
            </td>
        </tr>
    `}).join('');
}

function filterPros(status) {
    currentProFilter = status;
    loadPros();
}

async function verifyPro(proId, action) {
    const confirmMessages = {
        'verify': 'Êtes-vous sûr de vouloir vérifier ce professionnel ?',
        'reject': 'Êtes-vous sûr de vouloir rejeter cette inscription ?',
        'suspend': 'Êtes-vous sûr de vouloir suspendre ce professionnel ?',
        'reactivate': 'Êtes-vous sûr de vouloir réactiver ce professionnel ?'
    };

    if (!confirm(confirmMessages[action])) return;

    let rejectionReason = null;
    if (action === 'reject') {
        rejectionReason = prompt('Motif du rejet (optionnel):');
    }

    try {
        const res = await fetch(`${API_URL}/admin/pro-sellers/${proId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ action, rejection_reason: rejectionReason })
        });

        if (res.ok) {
            const actionLabels = {
                'verify': 'vérifié',
                'reject': 'rejeté',
                'suspend': 'suspendu',
                'reactivate': 'réactivé'
            };
            showToast(`✅ Professionnel ${actionLabels[action]} avec succès`);
            loadPros();
        } else {
            const error = await res.json();
            showToast(error.detail || 'Erreur lors de l\'action', 'error');
        }
    } catch (e) {
        showToast('Erreur serveur', 'error');
    }
}

// Pro DSA Details (for verification)
async function showProDSADetails(proId) {
    const modal = document.getElementById('pro-detail-modal');
    const content = document.getElementById('pro-detail-content');
    const title = document.getElementById('pro-detail-title');

    modal.classList.remove('hidden');
    content.innerHTML = '<div style="display: flex; justify-content: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const res = await fetch(`${API_URL}/admin/pro-sellers/${proId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!res.ok) throw new Error('Failed to load details');

        const p = await res.json();
        title.textContent = p.business_name || 'Détails Pro';

        const statusBadges = {
            'pending': '<span class="badge-status" style="background: #fef3c7; color: #92400e; font-size: 14px; padding: 8px 16px;">⏳ En attente de vérification</span>',
            'verified': '<span class="badge-status badge-active" style="font-size: 14px; padding: 8px 16px;">✅ Vérifié</span>',
            'rejected': '<span class="badge-status" style="background: #fee2e2; color: #991b1b; font-size: 14px; padding: 8px 16px;">❌ Rejeté</span>',
            'suspended': '<span class="badge-status" style="background: #f3f4f6; color: #6b7280; font-size: 14px; padding: 8px 16px;">🚫 Suspendu</span>'
        };

        const servicesHtml = (p.services || []).map(s => {
            const labels = { 'anti_waste': '🧺 Anti-gaspi', 'sale': '👕 Vente', 'rent': '🔑 Location' };
            return `<span class="badge-status badge-active" style="margin-right: 5px;">${labels[s] || s}</span>`;
        }).join('');

        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                ${statusBadges[p.status] || statusBadges['pending']}
            </div>

            <!-- Legal Info -->
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: #f8fafc;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-building"></i> Informations légales
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Raison sociale</div>
                        <div style="font-weight: 600;">${p.business_name || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Nom commercial</div>
                        <div style="font-weight: 600;">${p.trade_name || '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">SIREN</div>
                        <div style="font-weight: 600; font-family: monospace;">${p.siren ? p.siren.replace(/(\d{3})(?=\d)/g, '$1 ') : 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">SIRET</div>
                        <div style="font-weight: 600; font-family: monospace;">${p.siret || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">N° TVA</div>
                        <div style="font-weight: 600; font-family: monospace;">${p.tva_number || '-'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Forme juridique</div>
                        <div style="font-weight: 600;">${p.legal_form || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Address -->
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: #f8fafc;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-map-marker-alt"></i> Adresse du siège
                </h3>
                <div style="line-height: 1.6;">
                    ${p.address_line1 || ''}<br>
                    ${p.address_line2 ? p.address_line2 + '<br>' : ''}
                    ${p.postcode || ''} ${p.city || ''}<br>
                    ${p.country || 'France'}
                </div>
            </div>

            <!-- Contact -->
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: #f8fafc;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user-tie"></i> Représentant légal
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Nom</div>
                        <div style="font-weight: 600;">${p.contact_name || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Email</div>
                        <div style="font-weight: 600;">${p.contact_email || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 4px;">Téléphone</div>
                        <div style="font-weight: 600;">${p.contact_phone || '-'}</div>
                    </div>
                </div>
            </div>

            <!-- Services -->
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: #f8fafc;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-tags"></i> Services proposés
                </h3>
                <div>${servicesHtml || '<span style="color: #888;">Aucun service sélectionné</span>'}</div>
            </div>

            <!-- Documents for Verification -->
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: #fffbeb; border: 2px solid #fcd34d;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; display: flex; align-items: center; gap: 8px; color: #92400e;">
                    <i class="fas fa-file-alt"></i> Documents à vérifier
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">📄 Extrait Kbis</div>
                        ${p.kbis_document_url ? `
                            <a href="${p.kbis_document_url}" target="_blank" class="btn-sm" style="background: #3b82f6; color: white; display: inline-block; text-decoration: none;">
                                <i class="fas fa-external-link-alt"></i> Voir le document
                            </a>
                        ` : '<span style="color: #ef4444;">❌ Non fourni</span>'}
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">🪪 Pièce d'identité</div>
                        ${p.identity_document_url ? `
                            <a href="${p.identity_document_url}" target="_blank" class="btn-sm" style="background: #3b82f6; color: white; display: inline-block; text-decoration: none;">
                                <i class="fas fa-external-link-alt"></i> Voir le document
                            </a>
                        ` : '<span style="color: #ef4444;">❌ Non fourni</span>'}
                    </div>
                </div>
            </div>

            <!-- Verification History -->
            ${p.verified_at ? `
                <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #065f46;">
                        ✅ Vérifié le ${new Date(p.verified_at).toLocaleDateString('fr-FR')} 
                        ${p.verified_by ? 'par Admin' : ''}
                    </div>
                </div>
            ` : ''}

            ${p.rejection_reason ? `
                <div style="background: #fee2e2; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #991b1b;">
                        ❌ Motif de rejet: ${p.rejection_reason}
                    </div>
                </div>
            ` : ''}

            <!-- Actions -->
            ${p.status === 'pending' ? `
                <div style="display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <button class="btn-primary" style="flex: 1; background: #10b981;" onclick="verifyPro('${p.id}', 'verify'); closeModal();">
                        <i class="fas fa-check"></i> Vérifier ce professionnel
                    </button>
                    <button class="btn-primary" style="flex: 1; background: #ef4444;" onclick="verifyPro('${p.id}', 'reject'); closeModal();">
                        <i class="fas fa-times"></i> Rejeter
                    </button>
                </div>
            ` : ''}
        `;
    } catch (e) {
        console.error(e);
        content.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;">Erreur de chargement</div>';
    }
}

// Pro Details
async function showProDetails(proId) {
    const modal = document.getElementById('pro-detail-modal');
    const content = document.getElementById('pro-detail-content');
    const title = document.getElementById('pro-detail-title');

    modal.classList.remove('hidden');
    content.innerHTML = '<div style="display: flex; justify-content: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const res = await fetch(`${API_URL}/admin/pros/${proId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (!res.ok) throw new Error('Failed to load details');

        const data = await res.json();
        title.textContent = data.store_name || 'Détails du Pro';

        // Render Tags for Services
        const servicesHtml = (data.services || []).map(s => {
            const labels = { 'anti_waste': '🧺 Anti-gaspi', 'sale': '👕 Seconde Main', 'rent': '🔑 Location' };
            return `<span class="badge-status badge-active" style="margin-right: 5px;">${labels[s] || s}</span>`;
        }).join('');

        content.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; border-radius: 32px; background: #e8f5e9; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                    <i class="fas fa-store fa-2x" style="color: #4C7B4B;"></i>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${data.email}</div>
                    <div>${servicesHtml}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 4px;">Inscrit le ${new Date(data.created_at).toLocaleDateString()}</div>
                </div>
            </div>

            <div class="stats-row" style="margin-bottom: 24px;">
                <div class="stat-card mini">
                    <span class="stat-emoji">📦</span>
                    <div class="stat-info">
                        <span class="stat-value">${data.stats.total_orders}</span>
                        <span class="stat-label">Commandes</span>
                    </div>
                </div>
                <div class="stat-card mini">
                    <span class="stat-emoji">💶</span>
                    <div class="stat-info">
                        <span class="stat-value">${data.stats.total_revenue.toFixed(2)}€</span>
                        <span class="stat-label">CA Total</span>
                    </div>
                </div>
                <div class="stat-card mini">
                    <span class="stat-emoji">📑</span>
                    <div class="stat-info">
                        <span class="stat-value">${data.stats.active_items}</span>
                        <span class="stat-label">Annonces</span>
                    </div>
                </div>
            </div>

            <!-- Expert Performance Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                 <div class="card" style="padding: 16px; background: #fffde7; border: 1px solid #fff59d;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #fbc02d; text-transform: uppercase; letter-spacing: 0.5px;">Fidélité</h4>
                    <div style="font-size: 20px; font-weight: 700; color: #333;">${(data.stats.retention_rate || 0).toFixed(0)}%</div>
                    <div style="font-size: 11px; color: #888;">Clients récurrents</div>
                 </div>
                 <div class="card" style="padding: 16px; background: #e3f2fd; border: 1px solid #90caf9;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1976d2; text-transform: uppercase; letter-spacing: 0.5px;">Vitesse</h4>
                    <div style="font-size: 20px; font-weight: 700; color: #333;">${(data.stats.avg_days_to_sell || 0).toFixed(1)}j</div>
                    <div style="font-size: 11px; color: #888;">Temps moyen de vente</div>
                 </div>
                 <div class="card" style="padding: 16px; background: #e8f5e9; border: 1px solid #a5d6a7;">
                    <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #388e3c; text-transform: uppercase; letter-spacing: 0.5px;">Impact RSE</h4>
                    <div style="font-size: 20px; font-weight: 700; color: #333;">${(data.stats.co2_impact || 0).toFixed(1)}kg</div>
                    <div style="font-size: 11px; color: #888;">CO2 économisé</div>
                 </div>
            </div>

            <!-- Commercial Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                 <div class="card" style="padding: 16px; background: #f8fafc;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Panier Moyen (AOV)</h4>
                    <div style="font-size: 24px; font-weight: 700; color: #333;">${(data.stats.average_order_value || 0).toFixed(2)}€</div>
                 </div>
                 <div class="card" style="padding: 16px; background: #f8fafc;">
                    <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #666;">Taux de Conversion</h4>
                    <div style="font-size: 24px; font-weight: 700; color: #333;">${(data.stats.conversion_rate || 0).toFixed(1)}%</div>
                 </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Revenue Split -->
                <div>
                    <h3 style="font-size: 16px; margin-bottom: 12px;">Répartition du CA</h3>
                    ${data.service_split && data.service_split.length ? data.service_split.map(s => {
            const labels = { 'sale': 'Seconde Main', 'rent': 'Location', 'anti_waste': 'Panier Anti-gaspi', 'donation': 'Don' };
            const colors = { 'sale': '#4C7B4B', 'rent': '#2E7D32', 'anti_waste': '#81C784', 'donation': '#AED581' };
            const pct = (s.revenue / data.stats.total_revenue * 100) || 0;
            return `
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                                <span>${labels[s.type] || s.type}</span>
                                <span>${s.revenue.toFixed(0)}€ (${pct.toFixed(0)}%)</span>
                            </div>
                            <div style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: ${colors[s.type] || '#ccc'};"></div>
                            </div>
                        </div>
                        `;
        }).join('') : '<div style="color: #999; font-size: 14px;">Aucune donnée</div>'}
                </div>

                <!-- Top Categories -->
                <div>
                    <h3 style="font-size: 16px; margin-bottom: 12px;">Top Catégories</h3>
                    <div style="background: white; border-radius: 8px; border: 1px solid #eee;">
                        ${data.top_categories && data.top_categories.length ? data.top_categories.map((c, i) => `
                            <div style="padding: 8px 12px; display: flex; justify-content: space-between; border-bottom: ${i === data.top_categories.length - 1 ? 'none' : '1px solid #f0f0f0'};">
                                <span style="font-size: 13px;">${c.category}</span>
                                <span style="font-weight: 600; font-size: 13px;">${c.count} vtes</span>
                            </div>
                        `).join('') : '<div style="padding: 12px; color: #999; text-align: center; font-size: 13px;">Aucune donnée</div>'}
                    </div>
                </div>
            </div>

            <h3>Activité Récente</h3>
            <div class="card" style="margin-top: 12px;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.recent_activity.length ? data.recent_activity.map(a => `
                            <tr>
                                <td>${new Date(a.date).toLocaleDateString()} ${new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td>${a.item_title}</td>
                                <td style="font-weight: 500; color: #4C7B4B;">+${a.amount.toFixed(2)}€</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" style="text-align: center; color: #999;">Aucune activité récente</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;

    } catch (e) {
        content.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Erreur lors du chargement: ${e.message}</div>`;
    }
}

function closeProDetailModal() {
    document.getElementById('pro-detail-modal').classList.add('hidden');
}

// Add delete function to window scope
window.deleteUser = async function (userId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('Attempting to delete user:', userId);

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;

    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('Delete response status:', res.status);

        if (res.ok) {
            // refresh tables
            loadUsers();
            loadPros();
            alert('Utilisateur supprimé avec succès');
        } else {
            const err = await res.json();
            alert('Erreur: ' + (err.detail || 'Impossible de supprimer'));
        }
    } catch (e) {
        console.error('Delete error:', e);
        alert('Erreur réseau');
    }
};

// Items
async function loadItems() {
    let items = [];
    try {
        const res = await fetch(`${API_URL}/items`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.ok) items = await res.json();
    } catch (e) { }

    if (!items.length) {
        items = [
            { id: 1, title: 'Panier surprise', type: 'antigaspi', price: 5, seller_name: 'Boulangerie', status: 'available' },
        ];
    }

    const types = { sale: '🏷️ Vente', donation: '🎁 Don', antigaspi: '🧺 Anti-gaspi', rental: '🔄 Location' };

    const tbody = document.getElementById('items-table-body');
    tbody.innerHTML = items.map(i => `
        <tr>
            <td><strong>${i.title}</strong></td>
            <td>${types[i.type] || i.type}</td>
            <td>${i.price > 0 ? i.price + '€' : 'Gratuit'}</td>
            <td style="color: var(--text-secondary)">${i.seller_name || '-'}</td>
            <td><span class="badge-status ${i.status === 'available' ? 'badge-active' : 'badge-inactive'}">${i.status === 'available' ? 'En ligne' : 'Vendu'}</span></td>
            <td><button class="btn-sm btn-secondary" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Supprimer</button></td>
        </tr>
    `).join('');
}

// Impact
async function loadImpact() {
    let impact = {}, stats = {};
    try {
        const [iRes, sRes] = await Promise.all([
            fetch(`${API_URL}/territoire/impact?period=total`, { headers: { Authorization: `Bearer ${authToken}` } }),
            fetch(`${API_URL}/territoire/stats?period=total`, { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);
        if (iRes.ok) impact = await iRes.json();
        if (sRes.ok) stats = await sRes.json();
    } catch (e) {
        console.error('loadImpact:', e);
    }

    // CO2 réel (estimations stockées sur les annonces)
    const co2 = Math.round(impact.co2_evite_kg || stats.co2_economise_kg || 0);
    document.getElementById('impact-total').textContent = `${co2} kg`;
    document.getElementById('impact-trees').textContent = Math.round((co2 / 21) * 365).toLocaleString();
    document.getElementById('impact-car').textContent = Math.round(co2 / 0.12).toLocaleString();
    document.getElementById('impact-meals').textContent = Math.round(co2 / 3.75 * 1.5).toLocaleString();

    // Répartition par action (vraies quantités)
    const rep = impact.repartition_type || [];
    const findCount = (t) => (rep.find(r => r.type === t)?.count) || 0;
    const baskets = stats.paniers_sauves || 0;
    const donations = findCount('donation');
    const sales = findCount('sale');

    document.getElementById('impact-baskets').textContent = `${baskets} paniers`;
    document.getElementById('impact-donations').textContent = `${donations} dons`;
    document.getElementById('impact-sales').textContent = `${sales} ventes`;

    const max = Math.max(baskets, donations, sales, 1);
    const setBar = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.style.width = `${Math.round(100 * v / max)}%`;
    };
    setBar('impact-bar-baskets', baskets);
    setBar('impact-bar-donations', donations);
    setBar('impact-bar-sales', sales);
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}" style="color: ${type === 'error' ? '#ef4444' : 'var(--accent)'}"></i>
        <span>${message}</span>
    `;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// ============ DISPUTES ============

async function loadDisputes() {
    try {
        const res = await fetch(`${API_URL}/admin/disputes`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const disputes = await res.json();
            renderDisputes(disputes);
        }
    } catch (e) {
        console.error(e);
        showToast('Erreur chargement litiges', 'error');
    }
}

function renderDisputes(disputes) {
    const tbody = document.getElementById('disputes-table-body');
    if (!tbody) return;

    // Sort logic handled by backend usually, but ensuring order

    if (disputes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Aucun litige en cours</td></tr>';
        return;
    }

    tbody.innerHTML = disputes.map(d => {
        const statusColors = {
            'open': 'badge-pending',
            'closed': 'badge-inactive',
            'resolved_buyer': 'badge-active',
            'resolved_seller': 'badge-active'
        };
        const statusLabels = {
            'open': 'Ouvert',
            'closed': 'Fermé',
            'resolved_buyer': 'Remboursé',
            'resolved_seller': 'Rejeté'
        };

        const buttons = d.status === 'open' ? `
            <button class="btn-icon" onclick="resolveDispute('${d.id}', 'refund_full')" title="Rembourser Client" style="color: #4caf50;">
                <i class="fas fa-undo"></i>
            </button>
            <button class="btn-icon" onclick="resolveDispute('${d.id}', 'no_refund')" title="Libérer Paiement Vendeur" style="color: #f44336;">
                <i class="fas fa-check"></i>
            </button>
        ` : `<span style="color: #999;">-</span>`;

        return `
            <tr>
                <td>${new Date(d.created_at).toLocaleDateString()}</td>
                <td><span class="badge-${d.order_id ? 'sale' : 'rent'}" style="padding: 4px 8px; border-radius: 4px; font-size: 11px; background: #eee;">${d.order_id ? 'Vente' : 'Location'}</span></td>
                <td>${d.reason}</td>
                <td title="${d.description}">${d.description.length > 30 ? d.description.substring(0, 30) + '...' : d.description}</td>
                <td>${(d.amount || 0).toFixed(2)}€</td>
                <td><span class="badge-status ${statusColors[d.status]}">${statusLabels[d.status] || d.status}</span></td>
                <td>
                    <div class="actions">
                        ${buttons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function resolveDispute(id, resolution) {
    if (!confirm(resolution === 'refund_full' ? 'Rembourser le client intégralement ?' : 'Libérer les fonds pour le vendeur ?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/disputes/${id}/resolve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
                resolution: resolution,
                notes: "Resolved via Admin Dashboard"
            })
        });

        if (res.ok) {
            showToast('Litige résolu');
            loadDisputes();
        } else {
            showToast('Erreur lors de la résolution', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Erreur serveur', 'error');
    }
}

// ============ DATA DICTIONARY ============

let dataDictionary = [];

async function loadDataDictionary() {
    const tbody = document.getElementById('data-dictionary-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';

    try {
        const res = await fetch(`${API_URL}/admin/data-dictionary`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            dataDictionary = await res.json();
            renderDataDictionary();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Aucune donnée. Cliquez sur "Seed Initial Data" pour commencer.</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Erreur de chargement</td></tr>';
    }
}

function renderDataDictionary() {
    const tbody = document.getElementById('data-dictionary-table-body');
    if (!dataDictionary.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Aucune donnée. Cliquez sur "Seed Initial Data" pour commencer.</td></tr>';
        return;
    }

    const sensitivityBadges = {
        'EXPORT_SAFE': '<span class="privacy-badge safe"><i class="fas fa-check"></i> Export Safe</span>',
        'INTERNAL': '<span class="privacy-badge internal"><i class="fas fa-lock"></i> Interne</span>',
        'NEVER_EXPORT': '<span class="privacy-badge danger"><i class="fas fa-ban"></i> Jamais</span>'
    };

    tbody.innerHTML = dataDictionary.map(d => `
        <tr>
            <td>
                <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">${d.field_name}</code>
                <br><small style="color: #666;">${d.description}</small>
            </td>
            <td><span style="color: #666;">${d.data_type}</span></td>
            <td><code style="font-size: 12px;">${d.source_collection}</code></td>
            <td>${sensitivityBadges[d.sensitivity_tag] || d.sensitivity_tag}</td>
            <td>${d.usage_policy}</td>
            <td>
                <button class="btn-icon" onclick="viewDictionaryEntry('${d.id}')" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="deleteDictionaryEntry('${d.id}')" title="Supprimer" style="color: #ef4444;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function seedDataDictionary() {
    try {
        const res = await fetch(`${API_URL}/admin/data-dictionary/seed`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            showToast(`${data.count || 0} entrées créées`);
            loadDataDictionary();
        } else {
            showToast('Le dictionnaire existe déjà', 'error');
        }
    } catch (e) {
        showToast('Erreur', 'error');
    }
}

function viewDictionaryEntry(id) {
    const entry = dataDictionary.find(d => d.id === id);
    if (!entry) return;
    alert(`
Champ: ${entry.field_name}
Type: ${entry.data_type}
Collection: ${entry.source_collection}
Description: ${entry.description}
Exemple: ${entry.example || 'N/A'}
Sensibilité: ${entry.sensitivity_tag}
Politique: ${entry.usage_policy}
Transformation export: ${entry.export_transform || 'Aucune'}
    `);
}

async function deleteDictionaryEntry(id) {
    if (!confirm('Supprimer cette entrée du dictionnaire ?')) return;
    try {
        const res = await fetch(`${API_URL}/admin/data-dictionary/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Entrée supprimée');
            loadDataDictionary();
        } else {
            showToast('Erreur', 'error');
        }
    } catch (e) {
        showToast('Erreur', 'error');
    }
}

function showAddDictionaryModal() {
    alert('Fonctionnalité à implémenter: Modal d\'ajout de champ');
}

// ============ EVENT EXPLORER ============

async function loadEvents() {
    const tbody = document.getElementById('events-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';

    const eventType = document.getElementById('event-type-filter')?.value || '';
    const dateFrom = document.getElementById('event-date-from')?.value || '';
    const dateTo = document.getElementById('event-date-to')?.value || '';

    try {
        let url = `${API_URL}/admin/events?limit=50`;
        if (eventType) url += `&event_type=${eventType}`;
        if (dateFrom) url += `&date_from=${dateFrom}`;
        if (dateTo) url += `&date_to=${dateTo}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (res.ok) {
            const events = await res.json();
            renderEvents(events);
        }

        // Load funnel data
        loadEventsFunnel();
        loadEventTypes();

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef4444;">Erreur de chargement</td></tr>';
    }
}

function renderEvents(events) {
    const tbody = document.getElementById('events-table-body');
    if (!events.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Aucun événement</td></tr>';
        return;
    }

    const eventIcons = {
        'listing_created': '📦',
        'order_created': '🛒',
        'order_completed': '✅',
        'donation_pickup': '🎁',
        'rental_started': '🔑',
        'basket_sold': '🧺'
    };

    tbody.innerHTML = events.slice(0, 30).map(e => `
        <tr>
            <td>
                <span style="margin-right: 8px;">${eventIcons[e.event_type] || '📌'}</span>
                ${e.event_type}
            </td>
            <td>${e.admin_area_id || 'N/A'}</td>
            <td>${e.timestamp ? new Date(e.timestamp).toLocaleString() : 'N/A'}</td>
            <td><code style="font-size: 11px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">${JSON.stringify(e.metadata || {}).substring(0, 50)}...</code></td>
        </tr>
    `).join('');
}

async function loadEventsFunnel() {
    try {
        const res = await fetch(`${API_URL}/admin/events/funnel`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();

            // Update funnel values
            const maxCount = Math.max(...data.funnel.map(f => f.count), 1);

            document.getElementById('funnel-listings').textContent = data.funnel[0]?.count || 0;
            document.getElementById('funnel-reserved').textContent = data.funnel[1]?.count || 0;
            document.getElementById('funnel-completed').textContent = data.funnel[2]?.count || 0;

            // Update conversion rates
            document.getElementById('conv-listings-reserved').textContent = `${data.conversion_rates?.listings_to_reserved || 0}%`;
            document.getElementById('conv-reserved-completed').textContent = `${data.conversion_rates?.reserved_to_completed || 0}%`;
            document.getElementById('conv-overall').textContent = `${data.conversion_rates?.overall || 0}%`;

            // Update funnel bar widths
            const funnelBars = document.querySelectorAll('.funnel-bar');
            data.funnel.forEach((step, i) => {
                if (funnelBars[i]) {
                    const pct = (step.count / maxCount) * 100;
                    funnelBars[i].style.width = `${pct}%`;
                }
            });
        }
    } catch (e) {
        console.error('Failed to load funnel:', e);
    }
}

async function loadEventTypes() {
    try {
        const res = await fetch(`${API_URL}/admin/events/types`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const types = await res.json();
            const select = document.getElementById('event-type-filter');
            if (select) {
                select.innerHTML = '<option value="">Tous les types</option>' +
                    types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }
        }
    } catch (e) { }
}

// ============ AGGREGATION BUILDER ============

let wizardStep = 1;
let availableMetrics = [];

function initWizard() {
    wizardStep = 1;
    updateWizardUI();
    loadAvailableMetrics();
}

function updateWizardUI() {
    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach((el, i) => {
        el.classList.toggle('active', i + 1 <= wizardStep);
        el.classList.toggle('completed', i + 1 < wizardStep);
    });

    // Show current panel
    document.querySelectorAll('.wizard-panel').forEach((panel, i) => {
        panel.classList.toggle('active', i + 1 === wizardStep);
    });

    // Update buttons
    document.getElementById('wizard-prev').disabled = wizardStep === 1;
    document.getElementById('wizard-next').classList.toggle('hidden', wizardStep === 4);
    document.getElementById('wizard-save').classList.toggle('hidden', wizardStep !== 4);
}

function wizardNext() {
    if (wizardStep < 4) {
        wizardStep++;
        updateWizardUI();
    }
}

function wizardPrev() {
    if (wizardStep > 1) {
        wizardStep--;
        updateWizardUI();
    }
}

async function loadAvailableMetrics() {
    try {
        const res = await fetch(`${API_URL}/admin/export-definitions/metrics`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            availableMetrics = await res.json();
            renderMetricsCheckboxes();
        }
    } catch (e) {
        console.error(e);
    }
}

function renderMetricsCheckboxes() {
    const container = document.getElementById('metrics-checkboxes');
    if (!container) return;

    container.innerHTML = availableMetrics.map(m => `
        <label class="checkbox-card">
            <input type="checkbox" name="metrics" value="${m.id}">
            <div class="checkbox-card-content">
                <strong>${m.name}</strong>
                <small>${m.description}</small>
            </div>
        </label>
    `).join('');
}

async function saveExportDefinition() {
    const name = document.getElementById('export-name')?.value || 'Export sans nom';
    const granularity = document.querySelector('input[name="period-granularity"]:checked')?.value || 'week';
    const geoLevel = document.querySelector('input[name="geo-level"]:checked')?.value || 'VILLE';
    const kMin = parseInt(document.getElementById('k-min-threshold')?.value) || 30;

    const selectedMetrics = Array.from(document.querySelectorAll('input[name="metrics"]:checked'))
        .map(cb => cb.value);

    if (!name) {
        showToast('Veuillez donner un nom à l\'export', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/export-definitions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: name,
                period_granularity: granularity,
                geo_level: geoLevel,
                metrics: selectedMetrics,
                k_min_threshold: kMin
            })
        });

        if (res.ok) {
            showToast('Définition d\'export créée !');
            navigateTo('export-center');
        } else {
            showToast('Erreur lors de la création', 'error');
        }
    } catch (e) {
        showToast('Erreur serveur', 'error');
    }
}

// ============ EXPORT CENTER ============

let exportDefinitions = [];
let exportRuns = [];

async function loadExportCenter() {
    await Promise.all([loadExportDefinitions(), loadExportRuns()]);
}

async function loadExportDefinitions() {
    try {
        const res = await fetch(`${API_URL}/admin/export-definitions`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            exportDefinitions = await res.json();
            renderExportDefinitions();
        }
    } catch (e) {
        console.error(e);
    }
}

function renderExportDefinitions() {
    const container = document.getElementById('export-definitions-list');
    if (!container) return;

    if (!exportDefinitions.length) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Aucune définition. Créez-en une avec l\'Aggregation Builder.</div>';
        return;
    }

    container.innerHTML = exportDefinitions.map(d => `
        <div class="export-def-card">
            <div class="export-def-header">
                <strong>${d.name}</strong>
                <span class="badge-status badge-active">${d.geo_level}</span>
            </div>
            <div class="export-def-meta">
                <span><i class="fas fa-calendar"></i> ${d.period_granularity}</span>
                <span><i class="fas fa-shield-alt"></i> k_min=${d.k_min_threshold}</span>
            </div>
            <div class="export-def-actions">
                <button class="btn-sm btn-primary" onclick="generateExport('${d.id}')">
                    <i class="fas fa-play"></i> Générer
                </button>
            </div>
        </div>
    `).join('');
}

async function loadExportRuns() {
    const tbody = document.getElementById('export-runs-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/admin/exports`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            exportRuns = await res.json();
            renderExportRuns();
        }
    } catch (e) {
        console.error(e);
    }
}

function renderExportRuns() {
    const tbody = document.getElementById('export-runs-table-body');
    if (!exportRuns.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Aucun export généré</td></tr>';
        return;
    }

    const statusBadges = {
        'completed': '<span class="badge-status badge-active">Terminé</span>',
        'processing': '<span class="badge-status badge-pending">En cours...</span>',
        'failed': '<span class="badge-status badge-inactive">Échec</span>'
    };

    tbody.innerHTML = exportRuns.map(r => `
        <tr>
            <td>${r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}</td>
            <td>${r.export_def_name || 'Export'}</td>
            <td>${statusBadges[r.status] || r.status}</td>
            <td>
                ${r.status === 'completed' ? `
                    <button class="btn-sm btn-secondary" onclick="previewExport('${r.id}')">
                        <i class="fas fa-eye"></i> Aperçu
                    </button>
                    <button class="btn-sm btn-primary" onclick="downloadExport('${r.id}', 'json')">
                        <i class="fas fa-download"></i> JSON
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

async function generateExport(defId) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const res = await fetch(`${API_URL}/admin/exports/generate?export_def_id=${defId}&period_start=${weekAgo}&period_end=${today}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Export généré !');
            loadExportRuns();
        } else {
            showToast('Erreur lors de la génération', 'error');
        }
    } catch (e) {
        showToast('Erreur serveur', 'error');
    }
}

async function previewExport(runId) {
    try {
        const res = await fetch(`${API_URL}/admin/exports/${runId}/preview`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            alert(`Aperçu export (${data.total_rows} lignes):\n\n${JSON.stringify(data.preview, null, 2)}`);
        }
    } catch (e) {
        showToast('Erreur', 'error');
    }
}

async function downloadExport(runId, format) {
    try {
        const res = await fetch(`${API_URL}/admin/exports/${runId}/download?format=${format}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Create download
            const blob = new Blob([format === 'json' ? JSON.stringify(data.content, null, 2) : data.content], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Téléchargement démarré');
        }
    } catch (e) {
        showToast('Erreur', 'error');
    }
}

// ============ AUDIT LOGS ============

async function loadAuditLogs() {
    const tbody = document.getElementById('audit-logs-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></td></tr>';

    const action = document.getElementById('audit-action-filter')?.value || '';

    try {
        let url = `${API_URL}/admin/audit-logs?limit=100`;
        if (action) url += `&action=${action}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (res.ok) {
            const logs = await res.json();
            renderAuditLogs(logs);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Aucun log</td></tr>';
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444;">Erreur de chargement</td></tr>';
    }
}

function renderAuditLogs(logs) {
    const tbody = document.getElementById('audit-logs-table-body');
    if (!logs.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">Aucun log d\'audit</td></tr>';
        return;
    }

    const actionBadges = {
        'CREATE': '<span style="background: #e8f5e9; color: #4caf50; padding: 2px 8px; border-radius: 4px; font-size: 11px;">CREATE</span>',
        'UPDATE': '<span style="background: #fff3e0; color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 11px;">UPDATE</span>',
        'DELETE': '<span style="background: #ffebee; color: #f44336; padding: 2px 8px; border-radius: 4px; font-size: 11px;">DELETE</span>',
        'SEED': '<span style="background: #e3f2fd; color: #2196f3; padding: 2px 8px; border-radius: 4px; font-size: 11px;">SEED</span>',
        'GENERATE_EXPORT': '<span style="background: #f3e5f5; color: #9c27b0; padding: 2px 8px; border-radius: 4px; font-size: 11px;">EXPORT</span>'
    };

    tbody.innerHTML = logs.map(l => `
        <tr>
            <td>${l.created_at ? new Date(l.created_at).toLocaleString() : 'N/A'}</td>
            <td>${l.admin_name || 'Unknown'}</td>
            <td>${actionBadges[l.action] || l.action}</td>
            <td><code style="font-size: 11px;">${l.target_type || ''}</code></td>
            <td>${l.target_id ? `<code style="font-size: 10px;">${l.target_id.substring(0, 8)}...</code>` : '-'}</td>
        </tr>
    `).join('');
}

// ============ ENHANCED NAVIGATION ============

// Update loadPageData to include new pages
const originalLoadPageData = loadPageData;
window.loadPageData = function (page) {
    switch (page) {
        case 'data-dictionary': loadDataDictionary(); break;
        case 'events': loadEvents(); break;
        case 'aggregation-builder': initWizard(); break;
        case 'export-center': loadExportCenter(); break;
        case 'audit-logs': loadAuditLogs(); break;
        default: originalLoadPageData(page);
    }
};

// Add new page titles
const originalNavigateTo = navigateTo;
window.navigateTo = function (page) {
    currentPage = page;

    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });

    const titles = {
        overview: 'Dashboard',
        zones: 'Gestion des Zones',
        users: 'Utilisateurs',
        pros: 'Commerces Pro',
        disputes: 'Gestion des Litiges',
        items: 'Annonces',
        impact: 'Impact Environnemental',
        'data-dictionary': 'Data Dictionary',
        events: 'Event Explorer',
        'aggregation-builder': 'Aggregation Builder',
        'export-center': 'Export Center',
        'audit-logs': 'Audit Logs'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    // Hide all views
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.main-content').forEach(m => m.classList.add('hidden'));

    // Show target view
    const pageEl = document.getElementById(`page-${page}`);
    const viewEl = document.getElementById(`view-${page}`);

    if (pageEl) pageEl.classList.add('active');
    if (viewEl) viewEl.classList.remove('hidden');

    loadPageData(page);
};

// ============ DASHBOARD CHARTS ============

let trustChart = null;
let categoriesChart = null;

async function renderDashboardCharts() {
    // Fetch data for charts
    let users = [];
    let items = [];

    try {
        const usersRes = await fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (usersRes.ok) users = await usersRes.json();
    } catch (e) { console.error('Failed to load users for chart:', e); }

    try {
        const itemsRes = await fetch(`${API_URL}/items?limit=500`);
        if (itemsRes.ok) {
            const data = await itemsRes.json();
            items = Array.isArray(data) ? data : (data.items || []);
        }
    } catch (e) { console.error('Failed to load items for chart:', e); }

    // Count users by trust level
    const trustCounts = { new: 0, verified: 0, restricted: 0, banned: 0 };
    users.forEach(u => {
        const level = u.trust_level || 'new';
        if (trustCounts.hasOwnProperty(level)) trustCounts[level]++;
        else trustCounts['new']++;
    });

    // Count items by category
    const categoryCounts = {};
    items.forEach(i => {
        const cat = i.category || 'Autre';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Render Trust Levels Pie Chart
    const trustCtx = document.getElementById('chart-trust-levels');
    if (trustCtx) {
        if (trustChart) trustChart.destroy();
        trustChart = new Chart(trustCtx, {
            type: 'doughnut',
            data: {
                labels: ['Nouveau', 'Vérifié', 'Restreint', 'Banni'],
                datasets: [{
                    data: [trustCounts.new, trustCounts.verified, trustCounts.restricted, trustCounts.banned],
                    backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#8b8b9e', font: { size: 12 }, padding: 15 }
                    }
                }
            }
        });
    }

    // Render Item Categories Pie Chart
    const catCtx = document.getElementById('chart-item-categories');
    if (catCtx) {
        if (categoriesChart) categoriesChart.destroy();
        const catLabels = Object.keys(categoryCounts).slice(0, 6);
        const catData = catLabels.map(k => categoryCounts[k]);
        const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

        categoriesChart = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: colors.slice(0, catLabels.length),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#8b8b9e', font: { size: 12 }, padding: 15 }
                    }
                }
            }
        });
    }
}

// ============ PRO MODULE FUNCTIONS ============

// Load PRO Verifications
async function loadProVerifications() {
    const tbody = document.getElementById('pro-verifications-table-body');
    if (!tbody) return;

    const status = document.getElementById('verif-status-filter')?.value || '';
    const url = status ? `${API_URL}/admin/pro/verifications?status=${status}` : `${API_URL}/admin/pro/verifications`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const data = await res.json();

        // Update pending badge
        const pending = data.filter(v => v.status === 'PENDING').length;
        const badge = document.getElementById('pending-verif-badge');
        if (badge) {
            badge.textContent = pending;
            badge.style.display = pending > 0 ? 'inline' : 'none';
        }

        tbody.innerHTML = data.map(v => `
            <tr>
                <td>${new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
                <td><strong>${v.pro_profile?.legal_name || 'N/A'}</strong></td>
                <td><code>${v.pro_profile?.siret || 'N/A'}</code></td>
                <td><span class="badge ${getStatusClass(v.status)}">${v.status}</span></td>
                <td>
                    ${v.status === 'PENDING' ? `
                        <button class="btn-small success" onclick="approveVerification('${v.id}')">
                            <i class="fas fa-check"></i> Approuver
                        </button>
                        <button class="btn-small danger" onclick="rejectVerification('${v.id}')">
                            <i class="fas fa-times"></i> Rejeter
                        </button>
                    ` : `<span class="text-muted">—</span>`}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">Aucune vérification</td></tr>';
    } catch (err) {
        console.error('Error loading verifications:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">Erreur de chargement</td></tr>';
    }
}

async function approveVerification(id) {
    if (!confirm('Approuver cette vérification PRO ?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/pro/verifications/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Vérification approuvée ✅');
            loadProVerifications();
        } else {
            showToast('Erreur lors de l\'approbation', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

async function rejectVerification(id) {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
        const res = await fetch(`${API_URL}/admin/pro/verifications/${id}/reject?reason=${encodeURIComponent(reason)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Vérification rejetée');
            loadProVerifications();
        } else {
            showToast('Erreur lors du rejet', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

// Load PRO Offers
async function loadProOffers() {
    const tbody = document.getElementById('pro-offers-table-body');
    if (!tbody) return;

    const status = document.getElementById('offer-status-filter')?.value || '';
    let url = `${API_URL}/admin/pro/offers`;
    if (status) url += `?status=${status}`;

    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const data = await res.json();

        tbody.innerHTML = data.map(o => `
            <tr>
                <td>${new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                <td><strong>${o.title || 'Sans titre'}</strong></td>
                <td><span class="badge ${o.kind === 'ANTIGASPI_SALE' ? 'success' : 'info'}">${o.kind === 'ANTIGASPI_SALE' ? 'Anti-gaspi' : 'Location'}</span></td>
                <td>${o.pro_info?.legal_name || 'N/A'}</td>
                <td>${(o.price_cents / 100).toFixed(2)}€</td>
                <td><span class="badge ${getStatusClass(o.status)}">${o.status}</span></td>
                <td>
                    ${o.status === 'PUBLISHED' ? `
                        <button class="btn-small warning" onclick="suspendOffer('${o.id}')">
                            <i class="fas fa-pause"></i> Suspendre
                        </button>
                    ` : o.status === 'SUSPENDED' ? `
                        <button class="btn-small success" onclick="unsuspendOffer('${o.id}')">
                            <i class="fas fa-play"></i> Réactiver
                        </button>
                    ` : `<span class="text-muted">—</span>`}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" class="text-center">Aucune offre PRO</td></tr>';
    } catch (err) {
        console.error('Error loading offers:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-error">Erreur de chargement</td></tr>';
    }
}

async function suspendOffer(id) {
    const reason = prompt('Raison de la suspension:');
    if (!reason) return;

    try {
        const res = await fetch(`${API_URL}/admin/pro/offers/${id}/suspend?reason=${encodeURIComponent(reason)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Offre suspendue');
            loadProOffers();
        } else {
            showToast('Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

async function unsuspendOffer(id) {
    if (!confirm('Réactiver cette offre ?')) return;

    try {
        const res = await fetch(`${API_URL}/admin/pro/offers/${id}/unsuspend`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Offre réactivée ✅');
            loadProOffers();
        } else {
            showToast('Erreur', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

// Transparency DSA
async function loadTransparency() {
    try {
        const res = await fetch(`${API_URL}/admin/transparency`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const data = await res.json();

        document.getElementById('ranking-text').value = data.ranking_text || '';
        document.getElementById('dereferencing-text').value = data.dereferencing_rules_text || '';
    } catch (err) {
        console.error('Error loading transparency:', err);
    }
}

async function saveTransparency() {
    const ranking = document.getElementById('ranking-text').value;
    const dereferencing = document.getElementById('dereferencing-text').value;

    try {
        const res = await fetch(`${API_URL}/admin/transparency?ranking_text=${encodeURIComponent(ranking)}&dereferencing_rules_text=${encodeURIComponent(dereferencing)}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showToast('Textes de transparence mis à jour ✅');
        } else {
            showToast('Erreur lors de la sauvegarde', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

// DAC7 Exports
async function loadDac7Jobs() {
    const tbody = document.getElementById('dac7-jobs-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_URL}/admin/dac7/jobs`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        const data = await res.json();

        tbody.innerHTML = data.map(j => `
            <tr>
                <td>${new Date(j.created_at).toLocaleString('fr-FR')}</td>
                <td><strong>${j.year}</strong></td>
                <td>${j.sellers_count} vendeurs</td>
                <td><span class="badge success">${j.status}</span></td>
                <td><code title="${j.xml_hash}">${j.xml_hash?.substring(0, 12)}...</code></td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">Aucun export</td></tr>';
    } catch (err) {
        console.error('Error loading DAC7 jobs:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-error">Erreur de chargement</td></tr>';
    }
}

async function generateDac7Export() {
    const year = prompt('Année fiscale à exporter:', new Date().getFullYear() - 1);
    if (!year) return;

    try {
        showToast('Génération en cours...', 'info');
        const res = await fetch(`${API_URL}/admin/dac7/generate?year=${year}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            showToast(`Export généré: ${data.sellers_exported} vendeurs ✅`);
            loadDac7Jobs();
        } else {
            showToast('Erreur lors de la génération', 'error');
        }
    } catch (err) {
        showToast('Erreur réseau', 'error');
    }
}

// Helper for status badges
function getStatusClass(status) {
    const classes = {
        'PENDING': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'PUBLISHED': 'success',
        'DRAFT': 'secondary',
        'SUSPENDED': 'danger',
        'COMPLETED': 'success',
        'OPEN': 'warning',
        'MEDIATION': 'info'
    };
    return classes[status] || 'secondary';
}

