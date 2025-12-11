using System;
using System.Text;
using System.Security.Cryptography;
using UnityEngine;
using StonedRabbits.Core;

namespace StonedRabbits.Systems
{
    /// <summary>
    /// Handles save/load with encryption and offline progression
    /// </summary>
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        [Header("References")]
        [SerializeField] private Building[] _buildings;

        [Header("Settings")]
        [SerializeField] private float _autoSaveInterval = 30f;
        [SerializeField] private bool _useEncryption = true;

        // Encryption key (in production, use a more secure method)
        private const string ENCRYPTION_KEY = "StonedRabbits2024SecretKey!";
        private const string SAVE_KEY = "StonedRabbits_SaveData";

        private float _autoSaveTimer;

        [Serializable]
        private class SaveData
        {
            public double magicDust;
            public long lastSaveTimestamp;
            public BuildingSaveData[] buildings;
        }

        [Serializable]
        private class BuildingSaveData
        {
            public string buildingId;
            public int level;
            public double accumulatedDust;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            LoadGame();
        }

        private void Update()
        {
            // Auto-save
            _autoSaveTimer += Time.deltaTime;
            if (_autoSaveTimer >= _autoSaveInterval)
            {
                _autoSaveTimer = 0f;
                SaveGame();
            }
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus) SaveGame();
        }

        private void OnApplicationQuit()
        {
            SaveGame();
        }

        /// <summary>
        /// Save current game state
        /// </summary>
        public void SaveGame()
        {
            try
            {
                SaveData data = new SaveData
                {
                    magicDust = CurrencyManager.Instance?.GetDustValue() ?? 0,
                    lastSaveTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    buildings = new BuildingSaveData[_buildings.Length]
                };

                for (int i = 0; i < _buildings.Length; i++)
                {
                    if (_buildings[i] != null)
                    {
                        data.buildings[i] = new BuildingSaveData
                        {
                            buildingId = _buildings[i].Data?.name ?? $"Building_{i}",
                            level = _buildings[i].Level,
                            accumulatedDust = _buildings[i].GetAccumulatedDustValue()
                        };
                    }
                }

                string json = JsonUtility.ToJson(data);
                string saveString = _useEncryption ? Encrypt(json) : json;
                PlayerPrefs.SetString(SAVE_KEY, saveString);
                PlayerPrefs.Save();

                Debug.Log("[SaveManager] Game saved successfully");
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Save failed: {e.Message}");
            }
        }

        /// <summary>
        /// Load game state and calculate offline progress
        /// </summary>
        public void LoadGame()
        {
            try
            {
                if (!PlayerPrefs.HasKey(SAVE_KEY))
                {
                    Debug.Log("[SaveManager] No save data found, starting fresh");
                    return;
                }

                string saveString = PlayerPrefs.GetString(SAVE_KEY);
                string json = _useEncryption ? Decrypt(saveString) : saveString;
                SaveData data = JsonUtility.FromJson<SaveData>(json);

                // Restore currency
                CurrencyManager.Instance?.SetDust(data.magicDust);

                // Restore buildings
                for (int i = 0; i < _buildings.Length && i < data.buildings.Length; i++)
                {
                    if (_buildings[i] != null && data.buildings[i] != null)
                    {
                        _buildings[i].SetLevel(data.buildings[i].level);
                        _buildings[i].SetAccumulatedDust(data.buildings[i].accumulatedDust);
                    }
                }

                // Calculate offline progress
                long currentTime = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                long offlineSeconds = currentTime - data.lastSaveTimestamp;

                if (offlineSeconds > 0)
                {
                    CalculateOfflineProgress(offlineSeconds);
                }

                Debug.Log($"[SaveManager] Game loaded. Offline time: {offlineSeconds} seconds");
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveManager] Load failed: {e.Message}");
            }
        }

        /// <summary>
        /// Calculate and apply offline earnings
        /// </summary>
        private void CalculateOfflineProgress(long seconds)
        {
            // Cap offline time to 24 hours (86400 seconds)
            seconds = Math.Min(seconds, 86400);

            double totalOfflineDust = 0;

            foreach (var building in _buildings)
            {
                if (building != null)
                {
                    building.AddOfflineProduction(seconds);
                    // Optionally auto-collect offline earnings
                    // building.CollectDust();
                }
            }

            Debug.Log($"[SaveManager] Applied {seconds} seconds of offline production");
        }

        /// <summary>
        /// Delete save data (for testing/reset)
        /// </summary>
        public void DeleteSave()
        {
            PlayerPrefs.DeleteKey(SAVE_KEY);
            PlayerPrefs.Save();
            Debug.Log("[SaveManager] Save data deleted");
        }

        #region Encryption

        private string Encrypt(string plainText)
        {
            try
            {
                byte[] keyBytes = Encoding.UTF8.GetBytes(ENCRYPTION_KEY.Substring(0, 16));
                byte[] ivBytes = Encoding.UTF8.GetBytes(ENCRYPTION_KEY.Substring(0, 16));
                byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.IV = ivBytes;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using (ICryptoTransform encryptor = aes.CreateEncryptor())
                    {
                        byte[] encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
                        return Convert.ToBase64String(encryptedBytes);
                    }
                }
            }
            catch
            {
                // Fallback to unencrypted if encryption fails
                return plainText;
            }
        }

        private string Decrypt(string encryptedText)
        {
            try
            {
                byte[] keyBytes = Encoding.UTF8.GetBytes(ENCRYPTION_KEY.Substring(0, 16));
                byte[] ivBytes = Encoding.UTF8.GetBytes(ENCRYPTION_KEY.Substring(0, 16));
                byte[] encryptedBytes = Convert.FromBase64String(encryptedText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.IV = ivBytes;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using (ICryptoTransform decryptor = aes.CreateDecryptor())
                    {
                        byte[] decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
                        return Encoding.UTF8.GetString(decryptedBytes);
                    }
                }
            }
            catch
            {
                // If decryption fails, assume it's unencrypted
                return encryptedText;
            }
        }

        #endregion
    }
}
