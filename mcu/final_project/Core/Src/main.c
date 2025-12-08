/* USER CODE BEGIN Header */
/**
 ******************************************************************************
 * @file           : main.c
 * @brief          : Main program body
 ******************************************************************************
 * @attention
 *
 * Copyright (c) 2025 STMicroelectronics.
 * All rights reserved.
 *
 * This software is licensed under terms that can be found in the LICENSE file
 * in the root directory of this software component.
 * If no LICENSE file comes with this software, it is provided AS-IS.
 *
 ******************************************************************************
 */
/* USER CODE END Header */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include "usart.h"
#include "gpio.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include <math.h>
#include <stdio.h>
#include <string.h>
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

/* USER CODE BEGIN PV */
// --- DHT11 Variables ---
uint8_t Rh_byte1, Rh_byte2, Temp_byte1, Temp_byte2;
uint16_t SUM;
float Temperature = 0;
float Humidity = 0;
uint8_t Presence = 0;

// --- LDR Variables ---
uint32_t adc_val = 0;
float lux_val = 0;

// --- DS1302 Variables ---
uint8_t rtc_sec, rtc_min, rtc_hour, rtc_date, rtc_month, rtc_day, rtc_year;
char time_str[30];
char json_buffer[150]; // Buffer for UART sending
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

// ================= MICROSECOND DELAY (For DHT11) =================
// The HAL_Delay is milliseconds. We need microseconds.
// We use the DWT (Data Watchpoint and Trace) cycle counter.
void DWT_Delay_Init(void) {
  if (!(CoreDebug->DEMCR & CoreDebug_DEMCR_TRCENA_Msk)) {
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
    DWT->CYCCNT = 0;
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
  }
}

void delay_us(uint32_t us) {
  uint32_t start_tick = DWT->CYCCNT;
  uint32_t ticks = us * (HAL_RCC_GetHCLKFreq() / 1000000);
  while ((DWT->CYCCNT - start_tick) < ticks)
    ;
}

// ================= GPIO HELPERS =================
void Set_Pin_Output(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  GPIO_InitStruct.Pin = GPIO_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOx, &GPIO_InitStruct);
}

void Set_Pin_Input(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  GPIO_InitStruct.Pin = GPIO_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOx, &GPIO_InitStruct);
}

// ================= DHT11 DRIVER =================
void DHT11_Start(void) {
  Set_Pin_Output(GPIOB, GPIO_PIN_5); // PB5
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_5, 0);
  HAL_Delay(18); // Pull low for 18ms
  HAL_GPIO_WritePin(GPIOB, GPIO_PIN_5, 1);
  delay_us(20);
  Set_Pin_Input(GPIOB, GPIO_PIN_5);
}

uint8_t DHT11_Check_Response(void) {
  uint8_t Response = 0;
  delay_us(40);

  if (!(HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5))) {
    delay_us(80);
    if ((HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5)))
      Response = 1;
    else
      Response = -1;
  }

  // --- SAFETY FIX: Add Timeout ---
  // If the line stays HIGH forever, we must break out!
  uint32_t timeout = 1000;
  while ((HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5)) && timeout--)
    ;

  if (timeout == 0)
    return 0; // Error: Timeout
  return Response;
}

uint8_t DHT11_Read_Byte(void) {
  uint8_t i = 0, j;
  for (j = 0; j < 8; j++) {

    // --- SAFETY FIX 1: Wait for Pin LOW ---
    uint32_t timeout = 1000;
    while (!(HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5)) && timeout--)
      ;
    if (timeout == 0)
      return 0; // Escape if stuck LOW

    delay_us(40); // Measure pulse width

    if (!(HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5))) {
      i &= ~(1 << (7 - j)); // Logic 0
    } else {
      i |= (1 << (7 - j)); // Logic 1
    }

    // --- SAFETY FIX 2: Wait for Pin HIGH ---
    timeout = 1000;
    while ((HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_5)) && timeout--)
      ;
    if (timeout == 0)
      return 0; // Escape if stuck HIGH
  }
  return i;
}

// ================= DS1302 DRIVER =================
// Mapped: CLK=PB4, DAT=PB10, RST=PA8
#define DS_CLK_PORT GPIOB
#define DS_CLK_PIN GPIO_PIN_4
#define DS_DAT_PORT GPIOB
#define DS_DAT_PIN GPIO_PIN_10
#define DS_RST_PORT GPIOA
#define DS_RST_PIN GPIO_PIN_8

void DS1302_WriteByte(uint8_t dat) {
  Set_Pin_Output(DS_DAT_PORT, DS_DAT_PIN);
  for (int i = 0; i < 8; i++) {
    HAL_GPIO_WritePin(DS_DAT_PORT, DS_DAT_PIN, (dat & 0x01));
    HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 1); // Clock High
    delay_us(1);
    HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 0); // Clock Low
    delay_us(1);
    dat >>= 1;
  }
}

uint8_t DS1302_ReadByte(void) {
  uint8_t dat = 0;
  Set_Pin_Input(DS_DAT_PORT, DS_DAT_PIN);
  for (int i = 0; i < 8; i++) {
    dat >>= 1;
    if (HAL_GPIO_ReadPin(DS_DAT_PORT, DS_DAT_PIN))
      dat |= 0x80;
    HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 1);
    delay_us(1);
    HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 0);
    delay_us(1);
  }
  return dat;
}

void DS1302_Write(uint8_t addr, uint8_t dat) {
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 0);
  HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 0);
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 1); // Enable
  DS1302_WriteByte(addr);
  DS1302_WriteByte(dat);
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 0); // Disable
}

uint8_t DS1302_Read(uint8_t addr) {
  uint8_t temp;
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 0);
  HAL_GPIO_WritePin(DS_CLK_PORT, DS_CLK_PIN, 0);
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 1); // Enable
  DS1302_WriteByte(addr);
  temp = DS1302_ReadByte();
  HAL_GPIO_WritePin(DS_RST_PORT, DS_RST_PIN, 0); // Disable
  return temp;
}

void DS1302_Init() {
  DS1302_Write(0x8E, 0x00); // Disable write protection
  // Optional: Set time once if needed (Sec, Min, Hour, Date, Month, Day, Year)
   DS1302_Write(0x80, 0x00); // 00 Seconds
   DS1302_Write(0x82, 0x40); // 40 Minutes (example: set to current time)
   DS1302_Write(0x84, 0x11); // 11 Hours (24h format) 
   DS1302_Write(0x86, 0x08); // 8th Day
   DS1302_Write(0x88, 0x12); // December (month 12)
   DS1302_Write(0x8A, 0x01); // Sunday (day of week, 1-7)
   DS1302_Write(0x8C, 0x25); // Year 24 (2024)
   
   DS1302_Write(0x8E, 0x80); // Enable write protect
}

void DS1302_GetTime() {
  rtc_sec = DS1302_Read(0x81);
  rtc_min = DS1302_Read(0x83);
  rtc_hour = DS1302_Read(0x85);
  rtc_date = DS1302_Read(0x87);
  rtc_month = DS1302_Read(0x89);
  rtc_year = DS1302_Read(0x8D);
  // Convert BCD to Decimal
  rtc_sec = (rtc_sec / 16) * 10 + rtc_sec % 16;
  rtc_min = (rtc_min / 16) * 10 + rtc_min % 16;
  rtc_hour = (rtc_hour / 16) * 10 + rtc_hour % 16;
  rtc_date = (rtc_date / 16) * 10 + rtc_date % 16;
  rtc_month = (rtc_month / 16) * 10 + rtc_month % 16;
  rtc_year = (rtc_year / 16) * 10 + rtc_year % 16;
}
/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{

  /* USER CODE BEGIN 1 */

  /* USER CODE END 1 */

  /* MCU Configuration--------------------------------------------------------*/

  /* Reset of all peripherals, Initializes the Flash interface and the Systick. */
  HAL_Init();

  /* USER CODE BEGIN Init */

  /* USER CODE END Init */

  /* Configure the system clock */
  SystemClock_Config();

  /* USER CODE BEGIN SysInit */

  /* USER CODE END SysInit */

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_USART2_UART_Init();
  MX_ADC1_Init();
  MX_USART1_UART_Init();
  /* USER CODE BEGIN 2 */
  // 1. Initialize your custom libraries
  DWT_Delay_Init();
  DS1302_Init();

  // 2. Define your Startup Message (Use \r\n for a clean new line)
  char msg_start[] = "\r\n========================================\r\n"
                     "   STM32 F411RE Sensor Hub Starting...  \r\n"
                     "   Connection: 115200 baud              \r\n"
                     "========================================\r\n";

  // 3. Send it to the PC (huart2)
  HAL_UART_Transmit(&huart2, (uint8_t *)msg_start, strlen(msg_start), 100);
  HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1) {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
    // --- 1. Read DHT11 ---
    DHT11_Start();
    Presence = DHT11_Check_Response();
    Rh_byte1 = DHT11_Read_Byte();
    Rh_byte2 = DHT11_Read_Byte();
    Temp_byte1 = DHT11_Read_Byte();
    Temp_byte2 = DHT11_Read_Byte();
    SUM = DHT11_Read_Byte();

    // Verify Checksum
    if (SUM == (Rh_byte1 + Rh_byte2 + Temp_byte1 + Temp_byte2)) {
      Temperature = (float)Temp_byte1; // DHT11 only gives int precision usually
      Humidity = (float)Rh_byte1;
    }

    // --- 2. Read LDR (ADC) ---
    HAL_ADC_Start(&hadc1);
    if (HAL_ADC_PollForConversion(&hadc1, 100) == HAL_OK) {
      adc_val = HAL_ADC_GetValue(&hadc1);
    }
    HAL_ADC_Stop(&hadc1);

    // Debug ADC Print for raw LDR value
    // char adc_debug[50];
    // sprintf(adc_debug, "DEBUG ADC: raw=%lu\r\n", adc_val);
    // HAL_UART_Transmit(&huart2, (uint8_t*)adc_debug, strlen(adc_debug), 100);
    
    // Calculate Lux (Simplified math)
    float voltage = adc_val * (3.3 / 4095.0);
    float resistance = 10000 * (3.3 - voltage) / voltage;
    if (resistance < 10)
      resistance = 10;
    // Lux formula approx
    lux_val = 10 * pow((resistance / 50000), (-1 / 0.7));

    // --- 3. Read Time ---
    DS1302_GetTime();
    // Debug Time Print
    // char debug_str[100];
    // sprintf(debug_str,
    //         "DEBUG RTC: sec=%02X min=%02X hour=%02X date=%02X month=%02X "
    //         "year=%02X\r\n",
    //         rtc_sec, rtc_min, rtc_hour, rtc_date, rtc_month, rtc_year);
    // HAL_UART_Transmit(&huart2, (uint8_t *)debug_str, strlen(debug_str), 100);
    
    sprintf(time_str, "%02d/%02d/20%02d %02d:%02d:%02d", rtc_date, rtc_month,
            rtc_year, rtc_hour, rtc_min, rtc_sec);

    // --- 4. Format JSON ---
    // Make sure to enable "float with printf" in settings!
    memset(json_buffer, 0, sizeof(json_buffer));
    sprintf(json_buffer,
            "{\"temp\":%.1f,\"hum\":%.1f,\"lux\":%.1f,\"time\":\"%s\"}\r\n",
            Temperature, Humidity, lux_val, time_str);

    // --- 5. Send Data ---
    // To PC (USB)
    HAL_UART_Transmit(&huart2, (uint8_t *)json_buffer, strlen(json_buffer),
                      100);

    // To ESP32 (PA9/PA10)
    HAL_UART_Transmit(&huart1, (uint8_t *)json_buffer, strlen(json_buffer),
                      100);
//    HAL_UART_Transmit(&huart1, "b", strlen("b"), 100);
//    HAL_UART_Transmit(&huart1, (uint8_t *)"H", 1,
//                          100);
    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5); // Blink the green LED
    // Wait 2 seconds
    HAL_Delay(2000);
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  /** Configure the main internal regulator output voltage
  */
  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE1);

  /** Initializes the RCC Oscillators according to the specified parameters
  * in the RCC_OscInitTypeDef structure.
  */
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 16;
  RCC_OscInitStruct.PLL.PLLN = 336;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV4;
  RCC_OscInitStruct.PLL.PLLQ = 4;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  /** Initializes the CPU, AHB and APB buses clocks
  */
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK)
  {
    Error_Handler();
  }
}

/* USER CODE BEGIN 4 */

/* USER CODE END 4 */

/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  /* USER CODE BEGIN Error_Handler_Debug */
  /* User can add his own implementation to report the HAL error return state */
  __disable_irq();
  /* USER CODE END Error_Handler_Debug */
}
#ifdef USE_FULL_ASSERT
/**
  * @brief  Reports the name of the source file and the source line number
  *         where the assert_param error has occurred.
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(uint8_t *file, uint32_t line)
{
  /* USER CODE BEGIN 6 */
  /* User can add his own implementation to report the file name and line
     number, ex: printf("Wrong parameters value: file %s on line %d\r\n", file,
     line) */
  /* USER CODE END 6 */
}
#endif /* USE_FULL_ASSERT */
