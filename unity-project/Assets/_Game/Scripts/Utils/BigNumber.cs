using System;
using UnityEngine;

namespace StonedRabbits.Utils
{
    /// <summary>
    /// Handles large numbers for idle game math (supports up to 1e308)
    /// Uses double internally with mantissa/exponent display
    /// </summary>
    [Serializable]
    public struct BigNumber
    {
        [SerializeField] private double _value;

        public double Value => _value;

        public BigNumber(double value)
        {
            _value = value;
        }

        // Implicit conversions
        public static implicit operator BigNumber(double value) => new BigNumber(value);
        public static implicit operator BigNumber(int value) => new BigNumber(value);
        public static implicit operator BigNumber(long value) => new BigNumber(value);
        public static implicit operator double(BigNumber bn) => bn._value;

        // Arithmetic operators
        public static BigNumber operator +(BigNumber a, BigNumber b) => new BigNumber(a._value + b._value);
        public static BigNumber operator -(BigNumber a, BigNumber b) => new BigNumber(a._value - b._value);
        public static BigNumber operator *(BigNumber a, BigNumber b) => new BigNumber(a._value * b._value);
        public static BigNumber operator /(BigNumber a, BigNumber b) => new BigNumber(a._value / b._value);

        // Comparison operators
        public static bool operator <(BigNumber a, BigNumber b) => a._value < b._value;
        public static bool operator >(BigNumber a, BigNumber b) => a._value > b._value;
        public static bool operator <=(BigNumber a, BigNumber b) => a._value <= b._value;
        public static bool operator >=(BigNumber a, BigNumber b) => a._value >= b._value;
        public static bool operator ==(BigNumber a, BigNumber b) => Math.Abs(a._value - b._value) < double.Epsilon;
        public static bool operator !=(BigNumber a, BigNumber b) => !(a == b);

        public override bool Equals(object obj) => obj is BigNumber other && this == other;
        public override int GetHashCode() => _value.GetHashCode();

        /// <summary>
        /// Formats the number for display (e.g., 1.5K, 2.3M, 1.0e15)
        /// </summary>
        public override string ToString()
        {
            if (_value < 1000) return _value.ToString("F0");
            if (_value < 1_000_000) return (_value / 1000).ToString("F1") + "K";
            if (_value < 1_000_000_000) return (_value / 1_000_000).ToString("F1") + "M";
            if (_value < 1_000_000_000_000) return (_value / 1_000_000_000).ToString("F1") + "B";
            if (_value < 1_000_000_000_000_000) return (_value / 1_000_000_000_000).ToString("F1") + "T";

            // Scientific notation for very large numbers
            int exponent = (int)Math.Floor(Math.Log10(_value));
            double mantissa = _value / Math.Pow(10, exponent);
            return $"{mantissa:F2}e{exponent}";
        }

        /// <summary>
        /// Returns formatted string with decimal places
        /// </summary>
        public string ToString(int decimals)
        {
            if (_value < 1000) return _value.ToString($"F{decimals}");
            return ToString();
        }

        /// <summary>
        /// Power function for exponential growth calculations
        /// </summary>
        public static BigNumber Pow(BigNumber baseNum, double exponent)
        {
            return new BigNumber(Math.Pow(baseNum._value, exponent));
        }

        /// <summary>
        /// Floor function for integer conversions
        /// </summary>
        public static BigNumber Floor(BigNumber value)
        {
            return new BigNumber(Math.Floor(value._value));
        }

        /// <summary>
        /// Log base 10 for prestige calculations
        /// </summary>
        public static double Log10(BigNumber value)
        {
            return Math.Log10(value._value);
        }

        public static BigNumber Zero => new BigNumber(0);
        public static BigNumber One => new BigNumber(1);
    }
}
