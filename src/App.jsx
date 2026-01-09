import { useState } from "react";
import {
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Box,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Paper,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as SubtractIcon,
  Close as MultiplyIcon,
  Percent as DivideIcon,
  Square as SquareIcon,
  Functions as SquareRootIcon,
  ViewInAr as CubeIcon,
  Functions as CubeRootIcon,
  Calculate as CalculateIcon,
  PlayArrow as PlayArrowIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

function App() {
  const [operation, setOperation] = useState("addition");
  const [digitPattern, setDigitPattern] = useState("1x1");
  const [singleDigits, setSingleDigits] = useState(1);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);

  const isBinaryOperation = [
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ].includes(operation);

  const getRandomIntWithDigits = (digits, allowZeroStart = false) => {
    if (digits <= 0) return 0;
    if (digits === 1) {
      // For 1 digit: 0-9 (if allowZeroStart) or 1-9 (if not)
      return allowZeroStart
        ? Math.floor(Math.random() * 10)
        : Math.floor(Math.random() * 9) + 1;
    }
    // For 2+ digits: always start from 10^(digits-1) to ensure exact digit count
    // e.g., 2 digits = 10-99, 3 digits = 100-999
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const generateQuestions = () => {
    const list = [];

    for (let i = 0; i < Number(numQuestions || 0); i += 1) {
      if (isBinaryOperation) {
        // Parse digit pattern: "1x2" -> [1, 2]
        const patternParts = digitPattern
          .toLowerCase()
          .replace(/\s/g, "")
          .split("x");
        const d1 = Math.max(1, parseInt(patternParts[0] || "1", 10) || 1);
        const d2 = Math.max(1, parseInt(patternParts[1] || "1", 10) || 1);

        let a = getRandomIntWithDigits(d1, true);
        let b = getRandomIntWithDigits(d2, true);

        let displayOp = "+";
        let text = "";

        let answer = 0;

        switch (operation) {
          case "addition":
            displayOp = "+";
            text = `${a} + ${b}`;
            answer = a + b;
            break;
          case "subtraction":
            displayOp = "-";
            if (a < b) [a, b] = [b, a];
            text = `${a} - ${b}`;
            answer = a - b;
            break;
          case "multiplication":
            displayOp = "×";
            text = `${a} × ${b}`;
            answer = a * b;
            break;
          case "division": {
            displayOp = "÷";
            // For division: dividend should have d1 digits, divisor should have d2 digits
            // dividend ÷ divisor = quotient (whole number)
            const minDividend = 10 ** (d1 - 1); // e.g., 10 for 2 digits
            const maxDividend = 10 ** d1 - 1; // e.g., 99 for 2 digits

            let divisor, quotient, dividend;
            let attempts = 0;
            const maxAttempts = 10;

            // Try to generate a valid division problem
            do {
              divisor = getRandomIntWithDigits(d2, false); // divisor cannot be 0
              const minQuotient = Math.max(1, Math.ceil(minDividend / divisor));
              const maxQuotient = Math.floor(maxDividend / divisor);

              if (minQuotient <= maxQuotient) {
                quotient =
                  Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) +
                  minQuotient;
                dividend = divisor * quotient;

                // Check if dividend has exactly d1 digits
                const dividendDigits = dividend.toString().length;
                if (dividendDigits === d1) {
                  break; // Found valid division
                }
              }
              attempts++;
            } while (attempts < maxAttempts);

            // If we couldn't find a perfect match, use a safe fallback
            if (
              attempts >= maxAttempts ||
              !dividend ||
              dividend.toString().length !== d1
            ) {
              divisor = getRandomIntWithDigits(d2, false);
              quotient = Math.max(1, Math.floor(maxDividend / divisor));
              dividend = divisor * quotient;

              // If still wrong, force it to be within range
              if (dividend > maxDividend) {
                quotient = Math.floor(maxDividend / divisor);
                dividend = divisor * quotient;
              }
              if (dividend < minDividend) {
                quotient = Math.ceil(minDividend / divisor);
                dividend = divisor * quotient;
              }
            }

            a = dividend;
            b = divisor;
            text = `${a} ÷ ${b}`;
            answer = quotient;
            break;
          }
          default:
        }

        list.push({
          id: `${i + 1}`,
          text,
          a,
          b,
          operation: displayOp,
          answer,
        });
      } else {
        const digits = Number(singleDigits || 1);
        const n = getRandomIntWithDigits(digits, true);
        let text = "";
        let answer = 0;

        switch (operation) {
          case "square":
            text = `${n}²`;
            answer = n * n;
            break;
          case "squareRoot":
            // make perfect square
            {
              const root = getRandomIntWithDigits(digits, true);
              const val = root * root;
              text = `√${val}`;
              answer = root;
            }
            break;
          case "cube":
            text = `${n}³`;
            answer = n * n * n;
            break;
          case "cubeRoot":
            // make perfect cube
            {
              const root3 = getRandomIntWithDigits(digits, true);
              const val3 = root3 * root3 * root3;
              text = `∛${val3}`;
              answer = root3;
            }
            break;
          default:
        }

        list.push({
          id: `${i + 1}`,
          text,
          answer,
        });
      }
    }

    setQuestions(list);
  };

  const generatePDF = () => {
    if (questions.length === 0) {
      return;
    }

    const doc = new jsPDF();

    // Load and add logo
    const logoImg = new Image();
    logoImg.src = "/HK_MATH_STUDIO_FAVICON.png";

    // Wait for image to load, then generate PDF
    logoImg.onload = () => {
      // Add logo
      doc.addImage(logoImg, "PNG", 14, 10, 15, 15);

      // Title with HK_MATH_STUDIO
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("HK_MATH_STUDIO", 32, 20);

      // Subtitle with operation type
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const operationNames = {
        addition: "Addition",
        subtraction: "Subtraction",
        multiplication: "Multiplication",
        division: "Division",
        square: "Square",
        squareRoot: "Square Root",
        cube: "Cube",
        cubeRoot: "Cube Root",
      };
      doc.text(`Operation: ${operationNames[operation] || "Math"}`, 14, 30);

      // Date
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${date}`, 14, 37);

      // Prepare table data
      const tableData = questions.map((q, index) => [
        index + 1,
        q.text,
        "", // Solution column - empty for student to fill
        "", // Answer column - empty for student to fill
      ]);

      // Generate table
      autoTable(doc, {
        startY: 45,
        head: [["No.", "Question", "Solution", "Answer"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [70, 162, 176], // Primary color #46a2b0
          textColor: 255,
          fontStyle: "bold",
          fontSize: 11,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 20, halign: "center" }, // No. column
          1: { cellWidth: 30, halign: "center" }, // Question column (smaller)
          2: { cellWidth: 80, halign: "left" }, // Solution column (larger)
          3: { cellWidth: 50, halign: "left" }, // Answer column
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
        },
        margin: { top: 45, left: 14, right: 14 },
      });

      // Footer
      let pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Add Answer Key at the end
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#46a2b0");
      doc.text("Answer Key", 14, 30);

      // Format answers in compact format using full width
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const pageWidth = doc.internal.pageSize.width;
      const leftMargin = 14;
      const rightMargin = 14;
      const usableWidth = pageWidth - leftMargin - rightMargin;

      // Build all answer texts first
      const answerTexts = questions.map(
        (q, index) =>
          `${index + 1}] ${
            q.answer !== undefined ? q.answer.toString() : "N/A"
          }`
      );

      // Use exactly 10 answers per line
      const answersPerLine = 10;

      let yPosition = 45;
      let lineStart = 0;

      while (lineStart < answerTexts.length) {
        const lineAnswers = answerTexts.slice(
          lineStart,
          lineStart + answersPerLine
        );
        const numAnswers = lineAnswers.length;

        // Divide the full usable width into equal segments for each answer
        // Each answer will be centered in its segment
        const segmentWidth = usableWidth / numAnswers;

        // Position each answer in the center of its segment
        lineAnswers.forEach((text, idx) => {
          const segmentStart = leftMargin + idx * segmentWidth;
          const textWidth = doc.getTextWidth(text);
          // Center the text in its segment
          const xPosition = segmentStart + segmentWidth / 2 - textWidth / 2;
          doc.text(text, xPosition, yPosition);
        });

        yPosition += 7;
        lineStart += numAnswers;
      }

      // Update footer with new page count
      pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `HK_MATH_STUDIO_${operation}_${date.replace(
        /\s/g,
        "_"
      )}.pdf`;
      doc.save(fileName);
    };

    // If image fails to load, generate PDF without logo
    logoImg.onerror = () => {
      // Title with HK_MATH_STUDIO (without logo)
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#46a2b0");
      doc.text("HK_MATH_STUDIO", 14, 20, { color: "#46a2b0" });

      // Subtitle with operation type
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const operationNames = {
        addition: "Addition",
        subtraction: "Subtraction",
        multiplication: "Multiplication",
        division: "Division",
        square: "Square",
        squareRoot: "Square Root",
        cube: "Cube",
        cubeRoot: "Cube Root",
      };
      doc.text(`Operation: ${operationNames[operation] || "Math"}`, 14, 30);

      // Date
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${date}`, 14, 37);

      // Prepare table data
      const tableData = questions.map((q, index) => [
        index + 1,
        q.text,
        "", // Solution column - empty for student to fill
        "", // Answer column - empty for student to fill
      ]);

      // Generate table
      autoTable(doc, {
        startY: 45,
        head: [["No.", "Question", "Solution", "Answer"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [70, 162, 176], // Primary color #46a2b0
          textColor: 255,
          fontStyle: "bold",
          fontSize: 11,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 20, halign: "center" }, // No. column
          1: { cellWidth: 30, halign: "center" }, // Question column (smaller)
          2: { cellWidth: 80, halign: "left" }, // Solution column (larger)
          3: { cellWidth: 50, halign: "left" }, // Answer column
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
        },
        margin: { top: 45, left: 14, right: 14 },
      });

      // Footer
      let pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Add Answer Key at the end
      doc.addPage();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#46a2b0");
      doc.text("Answer Key", 14, 30);

      // Format answers in compact format using full width
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      const pageWidth = doc.internal.pageSize.width;
      const leftMargin = 14;
      const rightMargin = 14;
      const usableWidth = pageWidth - leftMargin - rightMargin;

      // Build all answer texts first
      const answerTexts = questions.map(
        (q, index) =>
          `${index + 1}] ${
            q.answer !== undefined ? q.answer.toString() : "N/A"
          }`
      );

      // Use exactly 10 answers per line
      const answersPerLine = 10;

      let yPosition = 45;
      let lineStart = 0;

      while (lineStart < answerTexts.length) {
        const lineAnswers = answerTexts.slice(
          lineStart,
          lineStart + answersPerLine
        );
        const numAnswers = lineAnswers.length;

        // Divide the full usable width into equal segments for each answer
        // Each answer will be centered in its segment
        const segmentWidth = usableWidth / numAnswers;

        // Position each answer in the center of its segment
        lineAnswers.forEach((text, idx) => {
          const segmentStart = leftMargin + idx * segmentWidth;
          const textWidth = doc.getTextWidth(text);
          // Center the text in its segment
          const xPosition = segmentStart + segmentWidth / 2 - textWidth / 2;
          doc.text(text, xPosition, yPosition);
        });

        yPosition += 7;
        lineStart += numAnswers;
      }

      // Update footer with new page count
      pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `HK_MATH_STUDIO_${operation}_${date.replace(
        /\s/g,
        "_"
      )}.pdf`;
      doc.save(fileName);
    };
  };

  const getOperationIcon = (op) => {
    switch (op) {
      case "addition":
        return <AddIcon />;
      case "subtraction":
        return <SubtractIcon />;
      case "multiplication":
        return <MultiplyIcon />;
      case "division":
        return <DivideIcon />;
      case "square":
        return <SquareIcon />;
      case "squareRoot":
        return <SquareRootIcon />;
      case "cube":
        return <CubeIcon />;
      case "cubeRoot":
        return <CubeRootIcon />;
      default:
        return <CalculateIcon />;
    }
  };

  return (
    <Box
      sx={{
        height: { xs: "90vh", sm: "80vh", md: "95vh" },
        width: "100vw",
        maxHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Header - Fixed at Top */}
      <Box
        sx={{
          width: "100%",
          py: 2,
          px: 3,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img
            src="/HK_MATH_STUDIO_FAVICON.png"
            alt="HK Math Studio Logo"
            style={{
              height: "50px",
              width: "auto",
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 700, color: "#46a2b0" }}
          >
            HK_MATHS_STUDIO
          </Typography>
        </Box>
      </Box>

      {/* Main Content - Two Panels Side by Side */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 2.5, md: 3 },
          overflow: { xs: "auto", sm: "hidden" },
          minHeight: 0,
        }}
      >
        {/* LEFT PANEL: Settings & Configuration (4 columns) */}
        <Box
          sx={{
            width: { xs: "100%", sm: "33.333%" },
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            minHeight: { xs: "auto", sm: 0 },
          }}
        >
          <Card
            sx={{
              height: { xs: "auto", sm: "100%" },
              minHeight: { xs: "400px", sm: 0 },
              maxHeight: { xs: "none", sm: "100%" },
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2.5, sm: 3 },
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                minHeight: 0,
                flex: 1,
              }}
            >
              {/* Settings Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 4,
                  pb: 2,
                  borderBottom: "2px solid",
                  borderColor: "primary.light",
                  flexShrink: 0,
                }}
              >
                {getOperationIcon(operation)}
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  Settings & Configuration
                </Typography>
              </Box>

              {/* Settings Form */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  overflowY: "auto",
                  flex: 1,
                  pr: 1,
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f1f5f9",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#cbd5e1",
                    borderRadius: "3px",
                  },
                }}
              >
                <FormControl
                  fullWidth
                  sx={{
                    mt: 1.5,
                    "& .MuiInputLabel-root": {
                      whiteSpace: "nowrap",
                      overflow: "visible",
                      textOverflow: "clip",
                    },
                  }}
                >
                  <InputLabel id="operation-type-label">
                    Operation Type
                  </InputLabel>
                  <Select
                    labelId="operation-type-label"
                    label="Operation Type"
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    sx={{
                      "& .MuiSelect-select": {
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      },
                    }}
                  >
                    <MenuItem value="addition">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AddIcon fontSize="small" />
                        Addition (+)
                      </Box>
                    </MenuItem>
                    <MenuItem value="subtraction">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <SubtractIcon fontSize="small" />
                        Subtraction (-)
                      </Box>
                    </MenuItem>
                    <MenuItem value="multiplication">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <MultiplyIcon fontSize="small" />
                        Multiplication (×)
                      </Box>
                    </MenuItem>
                    <MenuItem value="division">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <DivideIcon fontSize="small" />
                        Division (÷)
                      </Box>
                    </MenuItem>
                    <MenuItem value="square">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <SquareIcon fontSize="small" />
                        Square (n²)
                      </Box>
                    </MenuItem>
                    <MenuItem value="squareRoot">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <SquareRootIcon fontSize="small" />
                        Square Root (√)
                      </Box>
                    </MenuItem>
                    <MenuItem value="cube">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CubeIcon fontSize="small" />
                        Cube (n³)
                      </Box>
                    </MenuItem>
                    <MenuItem value="cubeRoot">
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CubeRootIcon fontSize="small" />
                        Cube Root (∛)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {isBinaryOperation ? (
                  <Box>
                    <TextField
                      fullWidth
                      label="Digit Pattern"
                      value={digitPattern}
                      onChange={(e) => setDigitPattern(e.target.value)}
                      placeholder="e.g. 1x2, 2x3, 3x3"
                      helperText="Format: first_digits x second_digits"
                      InputProps={{
                        sx: {
                          "& input": {
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: "1.1rem",
                          },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        mt: 1.5,
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      {["1x1", "1x2", "2x2", "2x3", "3x3", "4x4"].map(
                        (pattern) => (
                          <Chip
                            key={pattern}
                            label={pattern}
                            size="small"
                            onClick={() => setDigitPattern(pattern)}
                            color={
                              digitPattern === pattern ? "primary" : "default"
                            }
                            sx={{ cursor: "pointer" }}
                          />
                        )
                      )}
                    </Box>
                  </Box>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Number of Digits</InputLabel>
                    <Select
                      label="Number of Digits"
                      value={singleDigits}
                      onChange={(e) => setSingleDigits(Number(e.target.value))}
                    >
                      <MenuItem value={1}>1 digit</MenuItem>
                      <MenuItem value={2}>2 digits</MenuItem>
                      <MenuItem value={3}>3 digits</MenuItem>
                      <MenuItem value={4}>4 digits</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  type="number"
                  label="Number of Questions"
                  value={numQuestions}
                  inputProps={{ min: 1, max: 200 }}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  InputProps={{
                    sx: {
                      "& input": {
                        textAlign: "center",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                      },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={generateQuestions}
                  startIcon={<PlayArrowIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  Generate Questions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* RIGHT PANEL: Questions Preview (8 columns) */}
        <Box
          sx={{
            width: { xs: "100%", sm: "66.666%" },
            display: "flex",
            flexDirection: "column",
            flex: { xs: "0 1 auto", sm: 1 },
            minHeight: { xs: "400px", sm: 0 },
          }}
        >
          <Card
            sx={{
              height: { xs: "auto", sm: "100%" },
              minHeight: { xs: "400px", sm: "auto" },
              maxHeight: { xs: "600px", sm: "100%" },
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                minHeight: 0,
                height: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                  pb: 2,
                  borderBottom: "2px solid",
                  borderColor: "primary.light",
                  flexWrap: "wrap",
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  Questions Preview
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {questions.length > 0 && (
                    <Chip
                      label={`${questions.length} Questions`}
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  {questions.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PdfIcon />}
                      onClick={generatePDF}
                      sx={{
                        fontWeight: 600,
                        borderColor: "primary.main",
                        color: "primary.main",
                        "&:hover": {
                          borderColor: "primary.dark",
                          backgroundColor: "primary.light",
                          color: "primary.dark",
                        },
                      }}
                    >
                      Download PDF
                    </Button>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                {questions.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: { xs: 6, sm: 8 },
                      px: 2,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 0,
                    }}
                  >
                    <CalculateIcon
                      sx={{
                        fontSize: { xs: 48, sm: 64 },
                        color: "text.secondary",
                        opacity: 0.2,
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      No Questions Generated Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure settings on the left and click &quot;Generate
                      Questions&quot; to preview
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      overflowX: "hidden",
                      minHeight: 0,
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#f1f5f9",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#cbd5e1",
                        borderRadius: "4px",
                        "&:hover": {
                          background: "#94a3b8",
                        },
                      },
                    }}
                  >
                    <Grid container spacing={2}>
                      {questions.map((q, index) => (
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          md={4}
                          key={q.id}
                          sx={{
                            animation: `fadeInUp 0.5s ease-out ${
                              index * 0.03
                            }s both`,
                          }}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              textAlign: "center",
                              borderRadius: 2,
                              background: "#f8fafc",
                              border: "1px solid",
                              borderColor: "grey.200",
                              transition: "all 0.2s ease-in-out",
                              cursor: "pointer",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                borderColor: "primary.main",
                                background: "#ffffff",
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "primary.main",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                              }}
                            >
                              Q{q.id}
                            </Typography>
                            <Divider
                              sx={{
                                my: 1.5,
                                borderColor: "grey.300",
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: "text.primary",
                                fontFamily: "'Courier New', monospace",
                                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                              }}
                            >
                              {q.text}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
