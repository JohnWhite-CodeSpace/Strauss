export class ThemeManager{

// #######################################################################################################
    applyTheme(theme){
        const link = document.getElementById("themeStylesheet");
        link.href =`styles/${theme}.css`;
        localStorage.setItem("selectedTheme",theme);
    }

// #######################################################################################################
    loadSavedTheme(){
        const theme =localStorage.getItem("selectedTheme") || "dark";
        this.applyTheme(theme);
        document.getElementById("themeSelector").value = theme;
    }
}