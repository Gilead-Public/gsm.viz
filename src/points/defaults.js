const defaults = {
    scales: {
        x: {
            type: 'linear',
            label: undefined,
        },
        y: {
            type: 'linear',
            label: undefined,
        },
    },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
    tooltip: {
        format: undefined,
        formatter: undefined,
    },
    callbacks: {
        onClick: null,
        onHover: null,
        onSelect: null,
    },
    selection: {
        enabled: false,
        opacity: 0.2,
        multiple: false,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
    },
};

export default defaults;
