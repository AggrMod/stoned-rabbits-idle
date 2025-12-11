using UnityEngine;
using StonedRabbits.Utils;

namespace StonedRabbits.Data
{
    /// <summary>
    /// ScriptableObject defining a building's base stats
    /// Create instances via: Right-click > Create > StonedRabbits > BuildingData
    /// </summary>
    [CreateAssetMenu(fileName = "NewBuilding", menuName = "StonedRabbits/BuildingData")]
    public class BuildingData : ScriptableObject
    {
        [Header("Identity")]
        public string buildingName = "New Building";
        public string description = "A building that produces Magic Dust";
        public Sprite icon;

        [Header("Base Stats")]
        [Tooltip("Starting cost to purchase/upgrade to level 1")]
        public double baseCost = 10;

        [Tooltip("Base Magic Dust production per second at level 1")]
        public double baseProduction = 1;

        [Header("Growth Factors - DO NOT MODIFY")]
        [Tooltip("Cost multiplier per level (1.07 = 7% increase)")]
        public float costGrowthFactor = 1.07f;

        [Tooltip("Production multiplier per level (1.15 = 15% increase)")]
        public float productionGrowthFactor = 1.15f;

        [Header("Unlock Requirements")]
        [Tooltip("Total player level required to unlock this building")]
        public int unlockLevel = 0;

        [Tooltip("Is this building available from the start?")]
        public bool startsUnlocked = false;

        /// <summary>
        /// Calculate upgrade cost for a specific level
        /// Formula: BaseCost × (1.07^level)
        /// </summary>
        public BigNumber GetCostForLevel(int level)
        {
            if (level <= 0) return new BigNumber(baseCost);
            return new BigNumber(baseCost * System.Math.Pow(costGrowthFactor, level));
        }

        /// <summary>
        /// Calculate production rate for a specific level
        /// Formula: BaseProduction × (1.15^level)
        /// </summary>
        public BigNumber GetProductionForLevel(int level)
        {
            if (level <= 0) return BigNumber.Zero;
            return new BigNumber(baseProduction * System.Math.Pow(productionGrowthFactor, level));
        }
    }
}
