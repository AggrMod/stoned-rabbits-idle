using System.Collections.Generic;
using UnityEngine;
using StonedRabbits.Systems;
using StonedRabbits.Utils;

namespace StonedRabbits.Core
{
    /// <summary>
    /// Manages total production across all buildings
    /// Provides global production rate for UI display
    /// </summary>
    public class ProductionManager : MonoBehaviour
    {
        public static ProductionManager Instance { get; private set; }

        [Header("Buildings")]
        [SerializeField] private List<Building> _buildings = new List<Building>();

        /// <summary>
        /// Total production per second across all buildings
        /// </summary>
        public BigNumber TotalProductionPerSecond
        {
            get
            {
                BigNumber total = BigNumber.Zero;
                foreach (var building in _buildings)
                {
                    if (building != null && building.Level > 0)
                    {
                        total += building.CurrentProduction;
                    }
                }
                return total;
            }
        }

        /// <summary>
        /// Total accumulated dust ready to collect
        /// </summary>
        public BigNumber TotalAccumulatedDust
        {
            get
            {
                BigNumber total = BigNumber.Zero;
                foreach (var building in _buildings)
                {
                    if (building != null)
                    {
                        total += building.AccumulatedDust;
                    }
                }
                return total;
            }
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        /// <summary>
        /// Register a building with the production manager
        /// </summary>
        public void RegisterBuilding(Building building)
        {
            if (!_buildings.Contains(building))
            {
                _buildings.Add(building);
            }
        }

        /// <summary>
        /// Unregister a building
        /// </summary>
        public void UnregisterBuilding(Building building)
        {
            _buildings.Remove(building);
        }

        /// <summary>
        /// Collect dust from all buildings
        /// </summary>
        public void CollectAllDust()
        {
            foreach (var building in _buildings)
            {
                building?.CollectDust();
            }
        }

        /// <summary>
        /// Get all registered buildings
        /// </summary>
        public IReadOnlyList<Building> GetBuildings()
        {
            return _buildings.AsReadOnly();
        }
    }
}
