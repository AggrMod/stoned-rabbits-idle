using System;
using UnityEngine;
using StonedRabbits.Core;
using StonedRabbits.Data;
using StonedRabbits.Utils;

namespace StonedRabbits.Systems
{
    /// <summary>
    /// Runtime building instance that produces Magic Dust
    /// Attach to a building GameObject in the scene
    /// </summary>
    public class Building : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private BuildingData _data;

        [Header("Runtime State")]
        [SerializeField] private int _level = 1;
        [SerializeField] private double _accumulatedDust = 0;

        // Properties
        public BuildingData Data => _data;
        public int Level => _level;
        public BigNumber AccumulatedDust => new BigNumber(_accumulatedDust);

        // Events
        public event Action<Building> OnLevelChanged;
        public event Action<Building, BigNumber> OnDustProduced;
        public event Action<Building, BigNumber> OnDustCollected;

        // Cached calculations
        private BigNumber _currentProduction;
        private BigNumber _currentUpgradeCost;

        public BigNumber CurrentProduction => _currentProduction;
        public BigNumber CurrentUpgradeCost => _currentUpgradeCost;

        private float _productionTimer = 0f;
        private const float PRODUCTION_TICK = 1f; // Produce every 1 second

        private void Start()
        {
            RecalculateStats();
        }

        private void Update()
        {
            // Production tick
            _productionTimer += Time.deltaTime;
            if (_productionTimer >= PRODUCTION_TICK)
            {
                _productionTimer -= PRODUCTION_TICK;
                ProduceDust();
            }
        }

        /// <summary>
        /// Generate dust based on current production rate
        /// </summary>
        private void ProduceDust()
        {
            if (_level <= 0 || _data == null) return;

            BigNumber produced = _currentProduction;
            _accumulatedDust += produced.Value;
            OnDustProduced?.Invoke(this, produced);
        }

        /// <summary>
        /// Collect all accumulated dust and add to player's currency
        /// </summary>
        public void CollectDust()
        {
            if (_accumulatedDust <= 0) return;

            BigNumber collected = new BigNumber(_accumulatedDust);
            CurrencyManager.Instance?.AddDust(collected);
            _accumulatedDust = 0;
            OnDustCollected?.Invoke(this, collected);
        }

        /// <summary>
        /// Attempt to upgrade the building
        /// Returns true if successful
        /// </summary>
        public bool TryUpgrade()
        {
            if (CurrencyManager.Instance == null) return false;

            BigNumber cost = _currentUpgradeCost;
            if (CurrencyManager.Instance.SpendDust(cost))
            {
                _level++;
                RecalculateStats();
                OnLevelChanged?.Invoke(this);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Check if player can afford the upgrade
        /// </summary>
        public bool CanAffordUpgrade()
        {
            return CurrencyManager.Instance?.CanAfford(_currentUpgradeCost) ?? false;
        }

        /// <summary>
        /// Recalculate production and cost after level change
        /// </summary>
        private void RecalculateStats()
        {
            if (_data == null) return;
            _currentProduction = _data.GetProductionForLevel(_level);
            _currentUpgradeCost = _data.GetCostForLevel(_level);
        }

        /// <summary>
        /// Add offline production (called by SaveManager)
        /// </summary>
        public void AddOfflineProduction(double seconds)
        {
            if (_level <= 0 || _data == null) return;
            BigNumber offlineDust = _currentProduction * seconds;
            _accumulatedDust += offlineDust.Value;
        }

        /// <summary>
        /// Set level directly (for save/load)
        /// </summary>
        public void SetLevel(int level)
        {
            _level = Mathf.Max(0, level);
            RecalculateStats();
        }

        /// <summary>
        /// Set accumulated dust (for save/load)
        /// </summary>
        public void SetAccumulatedDust(double amount)
        {
            _accumulatedDust = amount;
        }

        /// <summary>
        /// Get accumulated dust as double (for serialization)
        /// </summary>
        public double GetAccumulatedDustValue()
        {
            return _accumulatedDust;
        }
    }
}
