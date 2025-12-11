using System;
using UnityEngine;
using StonedRabbits.Utils;

namespace StonedRabbits.Core
{
    /// <summary>
    /// Manages Magic Dust currency - the core resource of the game
    /// </summary>
    public class CurrencyManager : MonoBehaviour
    {
        public static CurrencyManager Instance { get; private set; }

        [Header("Currency")]
        [SerializeField] private double _startingDust = 0;

        private BigNumber _magicDust;
        public BigNumber MagicDust => _magicDust;

        // Events for UI updates (Observer Pattern)
        public event Action<BigNumber> OnDustChanged;
        public event Action<BigNumber> OnDustCollected;
        public event Action<BigNumber> OnDustSpent;

        private void Awake()
        {
            // Singleton setup
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            _magicDust = new BigNumber(_startingDust);
        }

        /// <summary>
        /// Add Magic Dust (from production, collection, rewards)
        /// </summary>
        public void AddDust(BigNumber amount)
        {
            if (amount <= 0) return;

            _magicDust += amount;
            OnDustChanged?.Invoke(_magicDust);
            OnDustCollected?.Invoke(amount);
        }

        /// <summary>
        /// Attempt to spend Magic Dust (for upgrades, purchases)
        /// Returns true if successful, false if insufficient funds
        /// </summary>
        public bool SpendDust(BigNumber amount)
        {
            if (amount <= 0) return false;
            if (_magicDust < amount) return false;

            _magicDust -= amount;
            OnDustChanged?.Invoke(_magicDust);
            OnDustSpent?.Invoke(amount);
            return true;
        }

        /// <summary>
        /// Check if player can afford a cost
        /// </summary>
        public bool CanAfford(BigNumber amount)
        {
            return _magicDust >= amount;
        }

        /// <summary>
        /// Set dust directly (for save/load)
        /// </summary>
        public void SetDust(BigNumber amount)
        {
            _magicDust = amount;
            OnDustChanged?.Invoke(_magicDust);
        }

        /// <summary>
        /// Get current dust as double (for serialization)
        /// </summary>
        public double GetDustValue()
        {
            return _magicDust.Value;
        }
    }
}
